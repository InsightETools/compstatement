let isLoaded = false;
console.log(isLoaded === false ? "Initializing" : "Initialize Failed");

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const getParams = () => new URLSearchParams(window.location.search);

const setParam = (key, value) => {
  const p = getParams();
  const hadPreview = p.get("pr") === "true";
  if (value === null || value === undefined) p.delete(key);
  else p.set(key, value);
  if (hadPreview && key !== "pr") p.set("pr", "true");
  history.replaceState(null, "", `${location.pathname}?${p.toString()}${location.hash}`);
};

const toggleActive = (id, isActive) => $("#" + id)?.classList.toggle("active", !!isActive);

const debounced = (fn, ms = 60) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};

let currentFetchController = null;

function buildFetchUrlFromParams() {
  const p = getParams();
  const key    = p.get("key");
  const cpid   = p.get("cpid");
  const yr     = p.get("yr");
  const ck     = p.get("ck");
  const ek     = p.get("ek") || "EmployeeA";
  const layout = p.get("layout");

  const baseUrl = "https://etools.secure-solutions.biz/totalcompadmin/design/ClientParamsExplorer.aspx";

  if (!key) {
    return `https://compstatementdemo.netlify.app/data/${ek}.json`;
  }

  const qp = new URLSearchParams({
    usecors: "1",
    key, cpid, yr, ck, ek, layout,
  });

  return `${baseUrl}?${qp.toString()}`;
}

window.applyOverflow = function () {
  document.querySelectorAll('[item="page"]').forEach((page) => {
    const lineEls = page.querySelectorAll(
      ".standardtablelinelabel, .standardtablevalue, .standardtablesubtotallabel, .standardtablesubtotalvalue"
    );
    const blockEls = page.querySelectorAll(
      ".standardtablesubtotalwrapper, .standardtablecategory"
    );

    const maxFontSize = 10, minFontSize = 8;
    const maxLineHeight = 12, minLineHeight = 8;
    const maxBlockSpacing = 5, minBlockSpacing = 2;

    let fontSize = maxFontSize;
    let lineHeight = maxLineHeight;
    let blockSpacing = maxBlockSpacing;

    const applyStyles = () => {
      lineEls.forEach((el) => {
        el.style.fontSize = `${fontSize}px`;
        el.style.lineHeight = `${lineHeight}px`;
      });
      blockEls.forEach((el) => {
        el.style.paddingTop = `${blockSpacing}px`;
        el.style.paddingBottom = `${blockSpacing}px`;
      });
    };

    const isOverflowing = () => {
      const pageRect = page.getBoundingClientRect();
      return Array.from(page.children).some((child) => {
        const r = child.getBoundingClientRect();
        return r.bottom > pageRect.bottom || r.right > pageRect.right;
      });
    };

    applyStyles();
    while (
      isOverflowing() &&
      (fontSize > minFontSize || lineHeight > minLineHeight || blockSpacing > minBlockSpacing)
    ) {
      if (fontSize > minFontSize) fontSize -= 1;
      if (lineHeight > minLineHeight) lineHeight -= 1;
      if (blockSpacing > minBlockSpacing) blockSpacing -= 1;
      applyStyles();
    }
  });
};

const _jsonDisabled = new Map();
const _designDisabled = new Map();
const _allKnownButtons = new Set();

function _collectButtons() {
  document.querySelectorAll('button[id], [role="button"][id], a.button[id], .btn[id]').forEach(el => {
    _allKnownButtons.add(el.id);
  });
  [
    "design1","design2","layout1","layout2","header1","header2",
    "cover0","cover1","cover2","cover3","noCover","benefitsPage","companyPage"
  ].forEach(id => { if (document.getElementById(id)) _allKnownButtons.add(id); });
}

function _setBtnDisabled(id, disabled) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle("disabled", !!disabled);
  el.toggleAttribute("disabled", !!disabled);
  el.setAttribute("aria-disabled", String(!!disabled));
}

function _applyEffectiveButtonStates() {
  _allKnownButtons.forEach((id) => {
    const jsonDis = !!_jsonDisabled.get(id);
    const desDis  = !!_designDisabled.get(id);
    _setBtnDisabled(id, jsonDis || desDis);
  });
}

function computeDesignConstraintsAndApply() {
  _designDisabled.clear();

  const params = getParams();
  const design = params.get("design") || "1";
  const isDesign2 = design === "2";

  const hasKey = params.has("key");
  const isPreview = params.has("preview");

  if (!hasKey && !isPreview) {
    $("#editButton")?.classList.add("hidden");
  }

  if (!hasKey) {
    $("#preparedFor")?.classList.add("hidden");
  }

  const forceOffIds = [
    "layout1","layout2",
    "cover0","cover1","cover2","cover3","noCover",
    "header1","header2"
  ];
  forceOffIds.forEach(id => { if (isDesign2) _designDisabled.set(id, true); });

  _applyEffectiveButtonStates();
}

const debouncedReloadFromParams = debounced(() => window.reloadFromParams(), 60);

window.reloadFromParams = async () => {

  if (currentFetchController) currentFetchController.abort();
  currentFetchController = new AbortController();

  const fetchUrl = buildFetchUrlFromParams();

  try {
    const res = await fetch(fetchUrl, { signal: currentFetchController.signal });
    const data = await res.json();

    await renderAll(data);

    if (typeof window.applyOverflow === "function") window.applyOverflow();

    isLoaded = true;
    console.log("Finished");
    setTimeout(() => {
      $("#loader")?.classList.add("finished");
    }, 3000);
    
  } catch (err) {
    if (err.name !== "AbortError") {
      const errorCheck = err.message?.includes?.("Unexpected token");
      alert(errorCheck ? "No User Found" : err);
    }
  } finally {
    currentFetchController = null;
  }
};

function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

function formatCurrency(value, element = null, decimalFlag = null, isCurrency = true) {
  if (value == null || isNaN(value)) return isCurrency ? "$0.00" : "0";
  const isDynamic = element?.getAttribute?.("number") === "dynamic";
  const isWhole =
    decimalFlag === false ||
    (!decimalFlag && isDynamic === false) ||
    element?.getAttribute?.("number") === "whole";
  const formatted = parseFloat(value).toLocaleString("en-US", {
    minimumFractionDigits: isWhole ? 0 : 2,
    maximumFractionDigits: isWhole ? 0 : 2,
  });
  return isCurrency ? `$${formatted}` : formatted;
}

window.__currentData = null;

function getSelectionsFromParams() {
  const p = getParams();
  return {
    design: p.get("design") || "1",
    layout: p.get("layout") || "1",
    header: p.get("header") || "1",
    cover:  (p.get("cover") ?? "0"),
    benefits: p.get("benefits") === "true",
    company:  p.get("company") === "true",
  };
}

function computeStatementTotal(data, sel) {
  const pricing = data?.pricing ?? {};
  let total = 0;

  const add = (val) => total += (Number(val) || 0);

  add(pricing.base);

  if (pricing.design && sel.design in pricing.design) add(pricing.design[sel.design]);
  if (pricing.layout && sel.layout in pricing.layout) add(pricing.layout[sel.layout]);
  if (pricing.header && sel.header in pricing.header) add(pricing.header[sel.header]);

  const coverKey = sel.cover === "false" ? "false" : sel.cover;
  if (pricing.cover && coverKey in pricing.cover) add(pricing.cover[coverKey]);

  if (pricing.toggles) {
    if (sel.benefits && "benefits" in pricing.toggles) add(pricing.toggles.benefits);
    if (sel.company && "company" in pricing.toggles) add(pricing.toggles.company);
  }

  return total;
}

function renderPrice(data) {
  if (!data) return;
  const sel = getSelectionsFromParams();
  const total = computeStatementTotal(data, sel);
  document.querySelectorAll('[details="price"]').forEach((el) => {
    el.textContent = formatCurrency(total, el, true, true);
  });
}

function renderDonutChart({ chartId, categoryGroup, containerSelector }) {
  const chartContainer = document.getElementById(chartId);
  const legendContainer = document.querySelector(containerSelector);
  if (!chartContainer || !legendContainer || !Array.isArray(categoryGroup)) return;

  legendContainer.innerHTML = "";
  let start = 0;
  const gradientParts = [];

  categoryGroup.forEach((category) => {
    const value = parseFloat(category.value);
    const color = hexToRgb(category.color);
    const end = start + value;

    const itemDiv = document.createElement("div");
    itemDiv.setAttribute("category", "item");
    itemDiv.classList.add("moduledonutindex");

    const iconDiv = document.createElement("div");
    iconDiv.setAttribute("category", "icon");
    iconDiv.classList.add("moduleindexcategorywrapper");

    const chartColorDiv = document.createElement("div");
    chartColorDiv.classList.add("chart-color");
    chartColorDiv.style.backgroundColor = color;

    const nameDiv = document.createElement("div");
    nameDiv.setAttribute("category", "name");
    nameDiv.classList.add("componentsmalllabel");
    nameDiv.textContent = category.label;

    const valueDiv = document.createElement("div");
    valueDiv.setAttribute("category", "value");
    valueDiv.classList.add("moduledonutindexvalue");
    valueDiv.textContent = value + "%";

    iconDiv.appendChild(chartColorDiv);
    iconDiv.appendChild(nameDiv);
    itemDiv.appendChild(iconDiv);
    itemDiv.appendChild(valueDiv);
    legendContainer.appendChild(itemDiv);

    gradientParts.push(`${color} ${start}% ${end}%`);
    start = end;
  });

  chartContainer.style.background = `conic-gradient(${gradientParts.join(", ")})`;
}

async function renderAll(data) {
  document.querySelectorAll(".modulewrapper").forEach((wrapper) => {
    const template =
      wrapper.querySelector("#moduleDonutTemplate") ||
      wrapper.querySelector('[data-template="donut"]');
    Array.from(wrapper.children).forEach((child) => {
      if (template && child === template) return;
      child.remove();
    });
    if (template) template.style.display = "none";
  });

  function applyButtonStatus() {
    _jsonDisabled.clear();
    const map = data?.buttonStatus;
    if (map && typeof map === "object") {
      Object.entries(map).forEach(([id, enabled]) => {
        const disabled = !enabled;
        _jsonDisabled.set(id, !!disabled);
      });
    }
    _applyEffectiveButtonStates();
  }

  function applyCompanyURL() {
    const url = data?.companyURL;
    document.querySelectorAll('[data="companyURL"]').forEach((el) => {
      if (!url) {
        if ("href" in el) {
          el.removeAttribute("href");
          el.setAttribute("aria-disabled", "true");
        }
        return;
      }
      if ("href" in el) el.href = url;
      else el.setAttribute("href", url);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
      el.removeAttribute("aria-disabled");
    });
  }

  function applyExplorerURL() {
    const url = data?.explorerUrl;
    document.querySelectorAll('[data="explorerUrl"]').forEach((el) => {
      if (!url) {
        if ("href" in el) {
          el.removeAttribute("href");
          el.setAttribute("aria-disabled", "true");
        }
        return;
      }
      if ("href" in el) el.href = url;
      else el.setAttribute("href", url);
      el.setAttribute("target", "_blank");
      el.setAttribute("rel", "noopener noreferrer");
      el.removeAttribute("aria-disabled");
    });
  }

  function applyCoverContent() {
    const arr = Array.isArray(data?.coverContent) ? data.coverContent : null;
    if (!arr || arr.length === 0) return;
    const templateImg = document.querySelector('img[data="coverContent"]');
    if (!templateImg) return;
    const parent = templateImg.parentElement;
    if (!parent) return;

    parent.querySelectorAll('img[data="coverContent"]').forEach((n, i) => {
      if (i > 0) n.remove();
    });

    templateImg.src = arr[0];
    for (let i = 1; i < arr.length; i++) {
      const clone = templateImg.cloneNode(true);
      clone.src = arr[i];
      parent.appendChild(clone);
    }
  }

  const statementElement = [
    "companyName","companyRepName","companyRepTitle","companyRepSignature","companySignatureText",
    "companySignature","companyAttn","companyAddress","companyUnit","companyCity","companyState","companyZip",
    "companyWelcome","companyMessage","employeeName","employeeFirstName","employeeAddress","employeeUnit",
    "employeeCity","employeeState","employeeZip","statementTitle","statementRange","statementYear",
    "statementDisclaimer","lookbackYear","lookbackMessage","lookaheadYear","lookaheadMessage","employeeTitle",
    "employeeSalary","hireDate","position"
  ];

  const elementColor = {
    primaryColor: data.primaryColor,
    secondaryColor: data.secondaryColor,
    tableColor: data.tableColor,
  };

  function staticData() {
    statementElement.forEach((key) => {
      document.querySelectorAll(`[data="${key}"]`).forEach((el) => {
        el.innerHTML = data[key] || "";
      });
    });

    document.querySelectorAll('[data="companyLogoCover"]').forEach((el) => {
      if (data.companyLogoCover) {
        el.setAttribute("src", data.companyLogoCover);
        if (data.companyLogoCoverHeight) el.style.height = data.companyLogoCoverHeight + "px";
        el.style.display = "";
      } else {
        el.removeAttribute("src");
        el.style.display = "none";
      }
    });

    document.querySelectorAll('[data="companyLogo"]').forEach((el) => {
      if (data.companyLogo) {
        el.setAttribute("src", data.companyLogo);
        el.style.display = "flex";
        el.style.justifyContent = "flex-end";
      } else {
        el.removeAttribute("src");
        el.style.display = "none";
      }
    });

    document.querySelectorAll('[data="companyLogoMail"]').forEach((el) => {
      if (data.companyLogoMail) {
        el.setAttribute("src", data.companyLogoMail);
        if (data.companyLogoMailHeight) el.style.height = data.companyLogoMailHeight + "px";
        el.style.display = "";
      } else {
        el.removeAttribute("src");
        el.style.display = "none";
      }
    });

    document.querySelectorAll('[data="companyLogoSideBar"]').forEach((el) => {
      if (data.companyLogoSideBar) {
        el.setAttribute("src", data.companyLogoSideBar);
        if (data.companyLogoSideBarHeight) el.style.height = data.companyLogoSideBarHeight + "px";
        el.style.display = "";
      } else {
        el.removeAttribute("src");
        el.style.display = "none";
      }
    });

    document.querySelectorAll('[data="explorerLogo"]').forEach((el) => {
      if (data.explorerLogo) {
        el.setAttribute("src", data.explorerLogo);
        el.style.display = "flex";
        el.style.justifyContent = "flex-end";
      } else {
        el.removeAttribute("src");
        el.style.display = "none";
      }
    });

    const signatureElements = document.querySelectorAll('[data="companySignature"]');
    if (!data.companySignature || !signatureElements.length) {
      signatureElements.forEach((el) => (el.style.display = "none"));
    } else {
      signatureElements.forEach((el) => {
        el.setAttribute("src", data.companySignature);
        el.style.display = "";
      });
    }

    Object.entries(elementColor).forEach(([attr, color]) => {
      document.querySelectorAll(`[color="${attr}"]`).forEach((el) => {
        const elementType = el.getAttribute("element");
        if (elementType === "text") el.style.color = color;
        else if (elementType === "block") el.style.backgroundColor = color;
        else if (elementType === "stroke") el.style.borderColor = elementColor.primaryColor;
      });
    });
  }

  function standardTables() {
    const categoryEntryTemplate = document.querySelector("#categoryEntry");
    const baseTableTemplate = document.querySelector("#tableTemplate");
    const tableContent = baseTableTemplate?.querySelector(".standardtablewrapper");
    if (!categoryEntryTemplate || !baseTableTemplate || !tableContent) return;

    (data.standardTables || []).forEach((table) => {
      const containers = document.querySelectorAll(`#standard${table.id}`);
      if (!containers.length) return;

      containers.forEach((container) => {
        container.innerHTML = "";

        const showCol1 = !!table.column1Name;
        const showCol2 = !!table.column2Name;
        const showCol3 = !!table.column3Name;

        const tableWrapper = tableContent.cloneNode(true);

        const tableNameEl = tableWrapper.querySelector('[table="name"]');
        if (tableNameEl) tableNameEl.textContent = table.name || "";

        const headerCol1 = tableWrapper.querySelector('[table="summaryHeaderCol1"]');
        const headerCol2 = tableWrapper.querySelector('[table="summaryHeaderCol2"]');
        const headerCol3 = tableWrapper.querySelector('[table="summaryHeaderCol3"]');

        if (!showCol1 && headerCol1) headerCol1.remove();
        else if (headerCol1) headerCol1.textContent = table.column1Name;

        if (!showCol2 && headerCol2) headerCol2.remove();
        else if (headerCol2) headerCol2.textContent = table.column2Name;

        if (!showCol3 && headerCol3) headerCol3.remove();
        else if (headerCol3) headerCol3.textContent = table.column3Name;

        const categoryListContainer = tableWrapper.querySelector(".standardtablelist");

        table.categories.forEach((category) => {
          const categoryClone = categoryEntryTemplate.cloneNode(true);
          categoryClone.removeAttribute("id");

          const existingList = categoryClone.querySelector("#categoryList");
          if (existingList) existingList.remove();

          const existingSubtotal = categoryClone.querySelector('[category="subtotal"]');
          if (existingSubtotal) existingSubtotal.remove();

          const categoryName = categoryClone.querySelector('[category="name"]');
          const categoryIcon = categoryClone.querySelector('[category="icon"]');
          if (categoryIcon) categoryIcon.style.backgroundColor = category.color;
          if (categoryName) categoryName.textContent = category.label;

          const categoryList = document.createElement("div");
          categoryList.classList.add("standardtablelinewrapper");

          category.items.forEach((lineitem, index) => {
            const lineClone = document.createElement("div");
            lineClone.classList.add("standardtablelineitem");
            lineClone.setAttribute("element", "text");
            lineClone.setAttribute("font", "bodyFont");
            if (index % 2 === 1) lineClone.classList.add("alternate");

            const labelDiv = document.createElement("div");
            labelDiv.setAttribute("line", "item");
            labelDiv.setAttribute("element", "text");
            labelDiv.setAttribute("font", "bodyFont");
            labelDiv.className = "standardtablelinelabel";
            labelDiv.textContent = lineitem.label;

            const valueWrapper = document.createElement("div");
            valueWrapper.className = "standardtablelabels";
            valueWrapper.setAttribute("element", "text");
            valueWrapper.setAttribute("font", "bodyFont");

            if (showCol1) {
              const col1Div = document.createElement("div");
              col1Div.setAttribute("line", "col1");
              col1Div.setAttribute("number", "dynamic");
              col1Div.setAttribute("element", "text");
              col1Div.setAttribute("font", "bodyFont");
              col1Div.className = "standardtablevalue";
              col1Div.textContent = formatCurrency(lineitem.col1_value, col1Div, table.isDecimal);
              valueWrapper.appendChild(col1Div);
            }
            if (showCol2) {
              const col2Div = document.createElement("div");
              col2Div.setAttribute("line", "col2");
              col2Div.setAttribute("number", "dynamic");
              col2Div.setAttribute("element", "text");
              col2Div.setAttribute("font", "bodyFont");
              col2Div.className = "standardtablevalue";
              col2Div.textContent = formatCurrency(lineitem.col2_value, col2Div, table.isDecimal);
              valueWrapper.appendChild(col2Div);
            }
            if (showCol3) {
              const col3Div = document.createElement("div");
              col3Div.setAttribute("line", "col3");
              col3Div.setAttribute("number", "dynamic");
              col3Div.setAttribute("element", "text");
              col3Div.setAttribute("font", "bodyFont");
              col3Div.className = "standardtablevalue";
              col3Div.textContent = formatCurrency(lineitem.col3_value, col3Div, table.isDecimal);
              valueWrapper.appendChild(col3Div);
            }

            lineClone.appendChild(labelDiv);
            lineClone.appendChild(valueWrapper);
            categoryList.appendChild(lineClone);
          });

          const subtotalClone = document.createElement("div");
          subtotalClone.classList.add("standardtablesubtotalwrapper");
          subtotalClone.setAttribute("category", "subtotal");
          subtotalClone.setAttribute("element", "text");
          subtotalClone.setAttribute("font", "bodyFont");

          const subLabel = document.createElement("div");
          subLabel.className = "standardtablesubtotallabel";
          subLabel.textContent = table.totalLineName || "Subtotal";
          subLabel.setAttribute("element", "text");
          subLabel.setAttribute("font", "bodyFont");

          const subWrapper = document.createElement("div");
          subWrapper.className = "standardtablelabels";
          subWrapper.setAttribute("element", "text");
          subWrapper.setAttribute("font", "bodyFont");

          if (showCol1) {
            const subCol1 = document.createElement("div");
            subCol1.setAttribute("subtotal", "col1");
            subCol1.setAttribute("number", "dynamic");
            subCol1.setAttribute("element", "text");
            subCol1.setAttribute("font", "bodyFont");
            subCol1.className = "standardtablesubtotalvalue";
            subCol1.textContent = formatCurrency(category.col1_subtotal, subCol1, table.isDecimal);
            subWrapper.appendChild(subCol1);
          }
          if (showCol2) {
            const subCol2 = document.createElement("div");
            subCol2.setAttribute("subtotal", "col2");
            subCol2.setAttribute("number", "dynamic");
            subCol2.setAttribute("element", "text");
            subCol2.setAttribute("font", "bodyFont");
            subCol2.className = "standardtablesubtotalvalue";
            subCol2.textContent = formatCurrency(category.col2_subtotal, subCol2, table.isDecimal);
            subWrapper.appendChild(subCol2);
          }
          if (showCol3) {
            const subCol3 = document.createElement("div");
            subCol3.setAttribute("subtotal", "col3");
            subCol3.setAttribute("number", "dynamic");
            subCol3.setAttribute("element", "text");
            subCol3.setAttribute("font", "bodyFont");
            subCol3.className = "standardtablesubtotalvalue";
            subCol3.textContent = formatCurrency(category.col3_subtotal, subCol3, table.isDecimal);
            subWrapper.appendChild(subCol3);
          }

          subtotalClone.appendChild(subLabel);
          subtotalClone.appendChild(subWrapper);
          categoryList.appendChild(subtotalClone);

          categoryClone.appendChild(categoryList);
          categoryListContainer.appendChild(categoryClone);
        });

        container.appendChild(tableWrapper);
      });
    });
  }

  function booleanTables() {
    const tableTemplate = document.querySelector("#booleanTableTemplate");
    const rowTemplateWrapper = document.querySelector("#booleanCategoryEntry");
    const rowTemplate = rowTemplateWrapper?.querySelector('[category="line"]');
    if (!tableTemplate || !rowTemplateWrapper || !rowTemplate) return;

    rowTemplateWrapper.style.display = "none";

    const columnMap = {
      column0Name: "zero",
      columnBoolName: "bool",
      column1Name: "one",
      column2Name: "two",
      column3Name: "three",
    };

    const createBoolSVG = (value, cell) => {
      const boolTemplate = rowTemplate.querySelector(
        `[boolvalue="${value ? "true" : "false"}"]`
      );
      const clone = boolTemplate?.cloneNode(true);
      if (clone && cell?.hasAttribute("color")) {
        const colorAttr = cell.getAttribute("color");
        const cssColor = elementColor?.[colorAttr];
        if (cssColor) {
          clone.querySelectorAll("svg, path, use").forEach((svgEl) => {
            svgEl.style.fill = cssColor;
            svgEl.style.color = cssColor;
          });
        }
      }
      return clone || document.createTextNode(value ? "\u2713" : "\u2717");
    };

    (data.booleanTables || []).forEach((tableData) => {
      const container = document.querySelector(`#${tableData.id}`);
      if (!container) return;

      container.innerHTML = "";
      const tableClone = tableTemplate.cloneNode(true);
      tableClone.removeAttribute("id");

      const hiddenColumns = [];

      for (const [labelKey, columnAttr] of Object.entries(columnMap)) {
        const labelValue = tableData[labelKey];
        const isMissing = labelValue == null || String(labelValue).trim() === "";
        if (isMissing) {
          hiddenColumns.push(columnAttr);
          tableClone.querySelectorAll(`[column="${columnAttr}"]`).forEach((el) => el.remove());
        } else {
          const totalKey = labelKey.replace("Name", "Total");
          const totalEl = tableClone.querySelector(`[table="${totalKey}"]`);
          if (totalEl) {
            totalEl.setAttribute("number", "dynamic");
            totalEl.textContent = formatCurrency(tableData[totalKey], totalEl, tableData.isDecimal);
          }
        }
      }

      Object.entries(tableData).forEach(([key, value]) => {
        const el = tableClone.querySelector(`[table="${key}"]`);
        if (el) el.textContent = value;
      });

      const listContainer = tableClone.querySelector('[table="list"]');
      if (!listContainer) return;

      tableData.categories.forEach((itemData, index) => {
        const rowClone = rowTemplate.cloneNode(true);
        if (index % 2 === 1) rowClone.classList.add("alternate");

        Object.entries(itemData).forEach(([key, value]) => {
          const cell = rowClone.querySelector(`[line="${key}"]`);

          const match = key.match(/^col(\d+|Bool|0)_/i);
          if (match) {
            const idx = match[1].toLowerCase();
            const columnAttr =
              idx === "0" ? "zero" :
              idx === "bool" ? "bool" :
              idx === "1" ? "one" :
              idx === "2" ? "two" :
              idx === "3" ? "three" : "";
            if (hiddenColumns.includes(columnAttr) || value == null) {
              if (cell) cell.remove();
              return;
            }
          }

          if (value == null && cell) {
            cell.remove();
            return;
          }

          if (key === "colBool_value" && cell) {
            cell.innerHTML = "";
            const icon = createBoolSVG(value, cell);
            if (icon) cell.appendChild(icon);
          } else if (cell?.hasAttribute("number")) {
            cell.textContent = formatCurrency(value, cell, tableData.isDecimal);
          } else if (cell) {
            cell.textContent = value;
          }
        });

        listContainer.appendChild(rowClone);
      });

      container.appendChild(tableClone);

      container
        .querySelectorAll('.booleantabletotalvalue[number="dynamic"]')
        .forEach((el) => {
          const value = el.textContent?.replace(/[^0-9.-]+/g, "") || "0";
          el.textContent = formatCurrency(parseFloat(value), el, tableData.isDecimal);
        });
    });
  }

  function modules() {
  if (!Array.isArray(data.modules) || data.modules.length === 0) {
    document.querySelectorAll(".moduletemplate").forEach((el) => (el.style.display = "none"));
    return;
  }

  const moduleData = data.modules || [];
  const validIds = new Set(moduleData.map((mod) => mod.id));

  document.querySelectorAll(".moduletemplate").forEach((el) => {
    const id = el.id?.trim();
    if (!validIds.has(id)) el.style.display = "none";
  });

  moduleData.forEach((module) => {
    if (!module || !module.id) return;
    if (
      (!module.label && !module.description && !module.disclaimer) &&
      (!Array.isArray(module.components) || module.components.length === 0)
    ) {
      const el = document.getElementById(module.id);
      if (el) el.style.display = "none";
      return;
    }

    const containers = document.querySelectorAll(`#${module.id}`);
    if (!containers.length) return;

    containers.forEach((moduleContainer) => {
      moduleContainer.style.display = "";

      const labelEl = moduleContainer.querySelector('[module="label"]');
      if (labelEl) {
        const value = module.label || "";
        labelEl.textContent = value;
        labelEl.style.display = value.trim() ? "" : "none";
      }

      const descEl = moduleContainer.querySelector('[module="description"]');
      if (descEl) {
        const value = module.description || "";
        descEl.textContent = value;
        descEl.style.display = value.trim() ? "" : "none";
      }

      const disclaimerEl = moduleContainer.querySelector('[module="disclaimer"]');
      if (disclaimerEl) {
        const value = module.disclaimer || "";
        disclaimerEl.textContent = value;
        disclaimerEl.style.display = value.trim() ? "" : "none";
      }

      const listEl = moduleContainer.querySelector('[module="list"]');
      const template = listEl?.querySelector('[module="component"]');
      if (!listEl || !template) return;

      listEl.querySelectorAll('[module="component"]').forEach((el) => {
        if (el !== template) el.remove();
      });

      let hasValidComponent = false;

      (module.components || []).forEach((component) => {
        const value = component?.value;
        const isEmpty = value === null || value === undefined || value === "";
        if (isEmpty) return;

        const componentClone = template.cloneNode(true);
        componentClone.style.display = "";
        componentClone.removeAttribute("id");

        const labelComponentEl = componentClone.querySelector('[category="label"]');
        if (labelComponentEl) {
          labelComponentEl.textContent = component.label || "";
          labelComponentEl.style.display = component.label?.trim() ? "" : "none";
        }

        const valueEl = componentClone.querySelector('[category="value"]');
        if (valueEl) {
          const isCurrency = component.type === "currency";
          const needsFormatting = ["currency", "number"].includes(component.type);
          const formattedValue = needsFormatting
            ? formatCurrency(value, valueEl, module.isDecimal, isCurrency)
            : value;
          valueEl.textContent = formattedValue;
        }

        const unitEl = componentClone.querySelector('[category="unit"]');
        if (unitEl) {
          unitEl.textContent = component.description || "";
          unitEl.style.display = component.description?.trim() ? "" : "none";
        }

        listEl.appendChild(componentClone);
        hasValidComponent = true;
      });

      template.style.display = "none";

      const hasTextContent =
        (module.label && module.label.trim()) ||
        (module.description && module.description.trim()) ||
        (module.disclaimer && module.disclaimer.trim());
      if (!hasValidComponent && !hasTextContent) {
        moduleContainer.style.display = "none";
      }
    });
  });
}

  function donutCharts() {
    const isVisible = (el) => {
      if (!el) return false;
      const style = window.getComputedStyle(el);
      return style.display !== "none" && style.visibility !== "hidden" && el.offsetParent !== null;
    };

    const wrappers = Array.from(document.querySelectorAll(".modulewrapper")).filter(isVisible);
    if (!wrappers.length) return;

    const charts = Array.isArray(data.charts) ? data.charts : [];
    if (!charts.length) return;

    wrappers.forEach((wrapper, wIdx) => {
      const templateInWrapper =
        wrapper.querySelector("#moduleDonutTemplate") ||
        wrapper.querySelector('[data-template="donut"]');

      const globalTemplate =
        document.getElementById("moduleDonutTemplate") ||
        document.querySelector('[data-template="donut"]');

      const template = templateInWrapper || globalTemplate;
      if (!template) return;

      template.style.display = "none";

      charts.forEach((chart, cIdx) => {
        const clone = template.cloneNode(true);
        clone.style.display = "";
        clone.removeAttribute("id");

        const chartId = `chart_${String(chart.id ?? cIdx)}__w${wIdx}`;
        const chartEl = clone.querySelector(".moduledonutchart");
        if (chartEl) {
          chartEl.id = chartId;
          if (data.chartSize) chartEl.classList.add(data.chartSize);
        }

        const labelEl = clone.querySelector('[category="label"]');
        const descEl  = clone.querySelector('[category="description"]');
        const discEl  = clone.querySelector('[category="disclaimer"]');
        const totalEl = clone.querySelector('[category="totalValue"]');

        if (labelEl) labelEl.textContent = chart.label ?? "";
        if (descEl)  descEl.textContent  = chart.description ?? "";
        if (discEl)  discEl.textContent  = chart.disclaimer ?? "";
        if (totalEl) totalEl.textContent = formatCurrency(chart.totalValue, totalEl, chart.isDecimal);

        const indexWrapper = clone.querySelector(".moduledonutindexwrapper");
        if (indexWrapper) {
          indexWrapper.innerHTML = "";
          (chart.groups || []).forEach((group) => {
            const item = document.createElement("div");
            item.classList.add("moduledonutindex");
            item.setAttribute("category", "item");

            const icon = document.createElement("div");
            icon.classList.add("moduleindexcategorywrapper");
            icon.setAttribute("category", "icon");

            const colorBox = document.createElement("div");
            colorBox.classList.add("chart-color");
            colorBox.style.backgroundColor = hexToRgb(group.color);

            const label = document.createElement("div");
            label.classList.add("componentsmalllabel");
            label.setAttribute("category", "name");
            label.textContent = group.label;

            icon.appendChild(colorBox);
            icon.appendChild(label);

            const value = document.createElement("div");
            value.classList.add("moduledonutindexvalue");
            value.setAttribute("category", "value");
            value.textContent = `${group.value}%`;

            item.appendChild(icon);
            item.appendChild(value);
            indexWrapper.appendChild(item);
          });
        }

        wrapper.appendChild(clone);

        renderDonutChart({
          chartId,
          categoryGroup: chart.groups,
          containerSelector: `#${chartId} + .moduledonutindexwrapper`,
        });
      });
    });
  }

  function benefitsList() {
    const listContainer = document.querySelector('[benefit="list"]');
    const wrapperTemplate = listContainer?.querySelector('[benefit="wrapper"]');
    if (!listContainer || !wrapperTemplate) return;

    listContainer.innerHTML = "";

    (data.benefits || []).forEach((benefit) => {
      const wrapperClone = wrapperTemplate.cloneNode(true);

      const nameEl = wrapperClone.querySelector('[benefit="name"]');
      const descEl = wrapperClone.querySelector('[benefit="description"]');

      if (nameEl) nameEl.textContent = benefit.name || "";
      if (descEl) {
        descEl.innerHTML = benefit.description || "";

        const paragraphClass = descEl.className;
        const listItems = descEl.querySelectorAll("li");
        listItems.forEach((li) => (li.className = paragraphClass));
      }

      listContainer.appendChild(wrapperClone);
    });
  }

  function holidaysList() {
    const holidayList = document.querySelector(".holidaylist");
    const holidayTemplate = holidayList?.querySelector(".holidaywrapper");
    if (!holidayList || !holidayTemplate) return;

    holidayList.innerHTML = "";

    (data.holidays || []).forEach((holiday) => {
      const wrapperClone = holidayTemplate.cloneNode(true);

      const weekdayEl = wrapperClone.querySelector(".holidayweekday");
      const dateEl = wrapperClone.querySelector(".holidaydate");
      const nameEl = wrapperClone.querySelector(".holidayname");

      if (weekdayEl) weekdayEl.textContent = holiday.weekday || "";
      if (dateEl) dateEl.textContent = holiday.date || "";
      if (nameEl) nameEl.textContent = holiday.name || "";

      holidayList.appendChild(wrapperClone);
    });
  }

  function applyCardAlignment(card, header, align) {
  card.style.removeProperty("text-align");
  header.style.removeProperty("justify-content");

  if (!align) return;

  const v = String(align).toLowerCase().trim();

  if (["left", "center", "right", "justify"].includes(v)) {
    card.style.textAlign = v;
  }

  if (v === "center") header.style.justifyContent = "center";
  else if (v === "right") header.style.justifyContent = "flex-end";
  else header.style.justifyContent = "flex-start";

  const lists = card.querySelectorAll("ul, ol");
  lists.forEach((list) => {
    if (v === "center" || v === "right") {
      list.style.listStyleType = "none";
      list.style.paddingLeft = "0";
      list.style.marginLeft = "0";
    } else {
      list.style.removeProperty("list-style-type");
      list.style.removeProperty("padding-left");
      list.style.removeProperty("margin-left");
    }
  });

  const moduleLists = card.querySelectorAll('[module="list"]');
  moduleLists.forEach((mod) => {
    mod.classList.remove("center", "right");
    if (v === "center" || v === "right") {
      mod.classList.add(v);
    }
  });
}

  function applyCardHeight(el, h) {
    el.style.removeProperty("height");
    el.style.removeProperty("min-height");

    if (h == null || h === "" || h === false) return;

    if (typeof h === "number" && !Number.isNaN(h)) {
      el.style.minHeight = `${h}px`;
      return;
    }
    if (typeof h === "string") {
      const trimmed = h.trim().toLowerCase();
      if (trimmed === "auto" || trimmed === "unset") return;
      if (/^\d+(\.\d+)?$/.test(trimmed)) {
        el.style.minHeight = `${trimmed}px`;
      } else {
        el.style.minHeight = h;
      }
    }
  }

  function wipeListModules() {
    document.querySelectorAll(".listmoduletemplate[data-lm='1']").forEach((el) => el.remove());
  }

  function renderListModules(data, elementColor) {
  wipeListModules();

  const items = Array.isArray(data?.listModules) ? data.listModules : [];
  const validIds = new Set(items.map((i) => String(i.id)));

  document.querySelectorAll("#listModule1").forEach((el) => {
    el.style.display = validIds.has(el.id) ? "" : "none";
  });
  document.querySelectorAll("#listModule2").forEach((el) => {
    el.style.display = validIds.has(el.id) ? "" : "none";
  });
  document.querySelectorAll("#listModule3").forEach((el) => {
    el.style.display = validIds.has(el.id) ? "" : "none";
  });
  document.querySelectorAll("#listModule4").forEach((el) => {
    el.style.display = validIds.has(el.id) ? "" : "none";
  });

  if (!items.length) return;

  const make = (tag, attrs = {}, text = null) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") n.className = v;
      else n.setAttribute(k, v);
    }
    if (text != null) n.textContent = text;
    return n;
  };

  items.forEach((item) => {
    const target = document.getElementById(String(item.id));
    if (!target) return;

    target.querySelectorAll(".listmoduletemplate[data-lm='1']").forEach((n) => n.remove());

    // ⬇️ add element="text" font="bodyFont"
    const heading  = make("div", { "data": "label", class: "listmoduleheading", element: "text", font: "bodyFont" }, item.label || "Additional Benefits");
    const header   = make("div", { module: "header", class: "listmoduleheader" });
    header.appendChild(heading);
    const headerColor = item.color || elementColor?.tableColor;
    if (headerColor) header.style.backgroundColor = headerColor;

    // ⬇️ add element="text" font="bodyFont"
    const detailsEl = make("div", { "data": "details", class: "listdescription", element: "text", font: "bodyFont" });
    if (item.details) detailsEl.textContent = item.details; else detailsEl.style.display = "none";

    const ul = make("ul", { "data": "values", role: "list", class: "listitemline" });
    (item.values || ["[Bullet Point]"]).forEach((val) => {
      // ⬇️ add element="text" font="bodyFont"
      const li = make("li", { "data": "value", class: "listitemtext", element: "text", font: "bodyFont" });
      li.innerHTML = val;
      ul.appendChild(li);
    });

    const listItems   = make("div", { module: "listItems", class: "listitemitems w-richtext" });
    listItems.appendChild(ul);

    const orientation = item.orientation || "vertical";
    const listWrapper = make("div", { module: "list", class: `listmodulelist ${orientation}` });
    listWrapper.appendChild(detailsEl);
    listWrapper.appendChild(listItems);

    const card = make("div", { module: "template", class: "listmoduletemplate", "data-lm": "1" });
    card.appendChild(header);
    card.appendChild(listWrapper);

    applyCardHeight(card, item.height);
    applyCardAlignment(card, header, item.align);
    target.appendChild(card);
  });
}

  function loadDisplay() {
  const renderParam = getParams().get("render");
  if (renderParam === "true") {
    const body = document.body;
    body.classList.remove("design");
    body.classList.add("render");

    const pageElements = Array.from(document.querySelectorAll('[element="page"]'));
    pageElements.forEach((el) => body.appendChild(el));

    Array.from(body.children).forEach((child) => {
      if (!pageElements.includes(child)) body.removeChild(child);
    });

    Array.from(body.childNodes).forEach((node) => {
      if (node.nodeType !== Node.ELEMENT_NODE) body.removeChild(node);
    });
  }

  const params = getParams();
  const getCurrentDesign = () => params.get("design") || "1";
  const coverParam = params.get("cover") ?? "0";
  const isDesign2 = getCurrentDesign() === "2";
  const showCover = coverParam !== "false" && !isDesign2;

  const coverEl = document.querySelector("#pageCover");
  if (coverEl) coverEl.style.display = showCover ? "" : "none";

  const isPreview = params.get("pr") === "true";
  const editorEl = document.getElementById("editorPanel");
  const pagesWrapper = document.getElementById("pagesWrapper");

  if (isPreview) sessionStorage.setItem("pr", "true");
  else sessionStorage.removeItem("pr");

  const showEditor = !isPreview;
  if (editorEl) editorEl.style.display = showEditor ? "" : "none";
  if (pagesWrapper) {
    if (showEditor) pagesWrapper.classList.remove("centered");
    else pagesWrapper.classList.add("centered");
  }

  setTimeout(() => $("#loader")?.classList.add("finished"), 500);
}
  
  function applyFontsFromData(data) {
  if (!data) return;

  const map = {
    primaryFont:   data.primaryFont   || "",
    secondaryFont: data.secondaryFont || "",
    bodyFont:      data.bodyFont      || ""
  };

  const loadOnce = (family) => {
    if (!family) return;
    const id = "gf-" + family.toLowerCase().replace(/\s+/g, "-");
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${family.trim().replace(/\s+/g, "+")}:wght@300;400;500;600;700&display=swap`;
    document.head.appendChild(link);
  };

  Object.values(map).forEach(loadOnce);

  const applyFamilies = () => {
    for (const [key, family] of Object.entries(map)) {
      if (!family) continue;
      document.querySelectorAll(`[element="text"][font="${key}"]`).forEach((el) => {
        el.style.fontFamily = `"${family}", sans-serif`;
      });
    }
  };

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(applyFamilies).catch(applyFamilies);
  } else {
    setTimeout(applyFamilies, 200);
  }
}

  function applyCustomFonts(data) { 
    document.querySelectorAll('[px="headerEmployeeNameSize"]').forEach((el) => {
      el.style.fontSize = data.headerEmployeeNameSize + "px";
      el.style.lineHeight = data.headerEmployeeNameSize + "px";
    });
    document.querySelectorAll('[px="welcomeFontSize"]').forEach((el) => {
      el.style.fontSize = data.welcomeFontSize + "px";
      el.style.lineHeight = data.welcomeFontSize + "px";
    });
    document.querySelectorAll('[px="headerYearSize"]').forEach((el) => {
      el.style.fontSize = data.headerYearSize + "px";
      el.style.lineHeight = data.headerYearSize + "px";
    });
    document.querySelectorAll('[px="headerNameSize"]').forEach((el) => {
      el.style.fontSize = data.headerNameSize + "px";
      el.style.lineHeight = data.headerNameSize + "px";
    });
    document.querySelectorAll('[px="headerEmployeeSize"]').forEach((el) => {
      el.style.fontSize = data.headerEmployeeSize + "px";
      el.style.lineHeight = data.headerEmployeeSize + "px";
    });
    document.querySelectorAll('[color="primaryColor"]').forEach((el) => {
      el.style.color = elementColor.primaryColor;
    });
    document.querySelectorAll('[color="secondaryColor"]').forEach((el) => {
      el.style.color = elementColor.secondaryColor;
    });
  }

  staticData();
  standardTables();
  booleanTables();
  modules();
  donutCharts();
  benefitsList();
  holidaysList();
  contactsLists(data.companyContacts, '[contacts="company"]');
  contactsLists(data.benefitContacts, '[contacts="providers"]');
  renderListModules(data, elementColor);
  applyCompanyURL();
  applyExplorerURL();
  applyCoverContent();
  loadDisplay();
  applyFontsFromData(data);
  applyCustomFonts(data);
  computeDesignConstraintsAndApply();
  applyButtonStatus();

  window.__currentData = data;
  renderPrice(window.__currentData);

  document.querySelectorAll("span").forEach((span) => {
  span.style.color = elementColor.primaryColor;
  span.style.fontWeight = "bold";
  const dataKey = span.getAttribute("data");
  if (dataKey && data[dataKey] !== undefined) span.textContent = data[dataKey];
});
}

(function controls() {
  const isDisabledBtn = (el) =>
    !el || el.classList.contains("disabled") || el.hasAttribute("disabled");

  const safeBind = (el, handler) => {
    if (!el) return;
    el.addEventListener("click", (e) => {
      if (isDisabledBtn(el)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      handler(e);
    });
  };

  const getCurrentDesign = () => getParams().get("design") || "1";
  const getCurrentLayout = () => getParams().get("layout") || "1";
  const getCurrentHeader = () => getParams().get("header") || "1";
  const getCurrentCover  = () => getParams().get("cover") ?? "0";

  const applyLayout = (val, { reload = true } = {}) => {
    if (getCurrentDesign() === "2") return;

    const isTwo = val === "2";
    $$('[layout="dynamic"]').forEach((el) => {
      if (isTwo) el.classList.add("layout2");
      else el.classList.remove("layout2");
    });

    $("#layout1")?.classList.toggle("active", !isTwo);
    $("#layout2")?.classList.toggle("active", isTwo);

    setParam("layout", val);

    computeDesignConstraintsAndApply();
    _applyEffectiveButtonStates();

    if (typeof window.applyOverflow === "function") window.applyOverflow();
    try { donutCharts(); } catch {}

    renderPrice(window.__currentData);

    if (reload) debouncedReloadFromParams();
  };

  const applyHeader = (val) => {
    const headerOneEl = document.getElementById("headerOne");
    const headerTwoEl = document.getElementById("headerTwo");

    if (val === "1") {
      if (headerOneEl) headerOneEl.style.display = "";
      if (headerTwoEl) headerTwoEl.style.display = "none";
    } else {
      if (headerOneEl) headerOneEl.style.display = "none";
      if (headerTwoEl) headerTwoEl.style.display = "";
    }

    $("#header1")?.classList.toggle("active", val === "1");
    $("#header2")?.classList.toggle("active", val === "2");

    setParam("header", val);

    if (typeof window.applyOverflow === "function") window.applyOverflow();
    computeDesignConstraintsAndApply();
    _applyEffectiveButtonStates();

    renderPrice(window.__currentData);
  };

  const applyCover = (val) => {
    if (getCurrentDesign() === "2") return;

    const targetClass = `cover${val}`;
    const allCoverClasses = ["cover0", "cover1", "cover2","cover3"];

    $$('[cover="dynamic"]').forEach((el) => {
      allCoverClasses.forEach((c) => el.classList.remove(c));
      el.classList.add(targetClass);
    });

    ["0", "1", "2", "3"].forEach((k) => $("#cover" + k)?.classList.toggle("active", k === val));
    $("#noCover")?.classList.remove("active");

    setParam("cover", val);
    updateExtras();

    computeDesignConstraintsAndApply();
    _applyEffectiveButtonStates();

    renderPrice(window.__currentData);
  };

  const applyDesignSwitch = (val, { reload = true } = {}) => {
    ["1", "2"].forEach((d) => {
      const show = d === val;
      $$(`[design="${d}"]`).forEach((el) => (el.style.display = show ? "" : "none"));
    });

    toggleActive("design1", val === "1");
    toggleActive("design2", val === "2");

    if (val === "2") setParam("cover", "false");

    setParam("design", val);
    updateExtras();

    if (val === "2") {
      const p = getParams();
      p.delete("layout");
      history.replaceState(null, "", `${location.pathname}?${p.toString()}${location.hash}`);
      $$('[layout="dynamic"]').forEach((el) => el.classList.remove("layout2"));
      $("#layout1")?.classList.remove("active");
      $("#layout2")?.classList.remove("active");
    } else {
      if (!getParams().has("layout")) setParam("layout", "1");
      applyLayout(getCurrentLayout(), { reload: false });
    }

    computeDesignConstraintsAndApply();
    _applyEffectiveButtonStates();

    renderPrice(window.__currentData);

    if (reload) debouncedReloadFromParams();
  };

  const updateExtras = () => {
    const design = getCurrentDesign();
    const isDesign2 = design === "2";

    ["0", "1", "2"].forEach((k) => {
      $("#cover" + k)?.classList.toggle("disabled", isDesign2);
      $("#cover" + k)?.toggleAttribute("disabled", isDesign2);
      $("#cover" + k)?.setAttribute("aria-disabled", String(isDesign2));
    });
    $("#noCover")?.classList.toggle("disabled", isDesign2);
    $("#noCover")?.toggleAttribute("disabled", isDesign2);
    $("#noCover")?.setAttribute("aria-disabled", String(isDesign2));

    ["benefits", "company"].forEach((key) => {
      const enabled = getParams().get(key) === "true";
      toggleActive(`${key}Page`, enabled);
      $$(`[design="${key}"]`).forEach((el) => {
        const match = !el.getAttribute("designgroup") || el.getAttribute("designgroup") === design;
        el.style.display = enabled && match ? "" : "none";
      });
    });

    const coverParam = getCurrentCover();
    const showCover = coverParam !== "false" && !isDesign2;

    ["0", "1", "2"].forEach((k) => toggleActive("cover" + k, showCover && coverParam === k));
    toggleActive("noCover", !showCover);

    $$('[component="cover"]').forEach((el) => {
      const match = !el.getAttribute("designgroup") || el.getAttribute("designgroup") === design;
      el.style.display = showCover && match ? "" : "none";
    });
  };

  const toggleExtra = (key) => {
    const current = getParams().get(key) === "true";
    setParam(key, (!current).toString());
    updateExtras();
    computeDesignConstraintsAndApply();
    _applyEffectiveButtonStates();

    renderPrice(window.__currentData);
  };

  const applyStateFromParams = () => {
    const design = getCurrentDesign();
    applyDesignSwitch(design, { reload: false });

    const header = getCurrentHeader();
    applyHeader(header);

    if (design !== "2") {
      const layout = getCurrentLayout();
      applyLayout(layout, { reload: false });

      const cover = getCurrentCover();
      if (cover !== "false") applyCover(cover);
      else updateExtras();
    } else {
      updateExtras();
    }

    computeDesignConstraintsAndApply();
    _applyEffectiveButtonStates();

    debouncedReloadFromParams();

    renderPrice(window.__currentData);
  };

  // --- Employee switcher (full page reload) ---
  function selectEmployee(ekId) {
    setParam("ek", ekId);
    window.location.reload();
  }

  document.addEventListener("DOMContentLoaded", () => {
    _collectButtons();
    computeDesignConstraintsAndApply();

    const designBtns = document.querySelectorAll('[id^="design-"]');
    if (designBtns.length) {
      designBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const idNum = btn.id.split("-")[1];
          const params = getParams();
          history.replaceState(null, "", `/design/design-${idNum}?${params.toString()}${location.hash}`);
          setParam("design", idNum);
          applyStateFromParams();
        });
      });

      const pathMatch = window.location.pathname.match(/design-(\d+)$/);
      if (pathMatch) {
        const activeDesign = document.getElementById(`design-${pathMatch[1]}`);
        if (activeDesign) {
          designBtns.forEach((b) => b.classList.toggle("active", b === activeDesign));
        }
      }
    }

    const demoEl = document.getElementById("demo");
    if (demoEl) demoEl.style.display = getParams().get("demo") === "true" ? "" : "none";

    const params = getParams();
    const isPreview = params.get("pr") === "true";

    let scale = isPreview ? 1.0 : 0.7;

    const zoomLevelEl = $("#zoomLevel");
    const updateZoom = () => {
      $$('[item="page"]').forEach((el) => (el.style.zoom = scale));
      if (zoomLevelEl) zoomLevelEl.textContent = `${Math.round(scale * 100)}%`;
    };

    $("#fullScreen")?.addEventListener("click", () =>
    $("#editorPanel")?.classList.toggle("hidden")
    );
    $("#zoomOut")?.addEventListener("click", () => {
      scale = Math.max(0.1, scale - 0.1);
      updateZoom();
    });
    $("#zoomIn")?.addEventListener("click", () => {
      scale = Math.min(2, scale + 0.1);
      updateZoom();
    });

updateZoom();

    const empBtns = $$('[id^="Employee"]');
    let ek = getParams().get("ek");
    if (!ek || !document.getElementById(ek)) {
      ek = "EmployeeA";
      setParam("ek", ek);
    }
    empBtns.forEach((btn) => btn.classList.toggle("active", btn.id === ek));
    empBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.classList.contains("active")) return;
        selectEmployee(btn.id);
      });
    });

    const scrollToComponent = (btnId, key) => {
      $("#" + btnId)?.addEventListener("click", () => {
        const target = $(`[design="${key}"]`);
        if (target) {
          const offset = target.offsetTop - ($("#pagesWrapper")?.offsetTop || 0);
          $("#pagesWrapper")?.scrollTo({ top: offset, behavior: "smooth" });
        }
      });
    };
    scrollToComponent("benefitsPage", "benefits");
    scrollToComponent("companyPage", "company");

    const getUrlWithPreviewParam = () => {
      const url = new URL(window.location.href);
      if (!url.searchParams.has("preview")) url.searchParams.set("preview", "true");
      return url.toString();
    };
    
    const safeBindClick = (id, fn) => safeBind($("#" + id), fn);

    safeBindClick("design1", () => applyDesignSwitch("1"));
    safeBindClick("design2", () => applyDesignSwitch("2"));

    safeBindClick("cover0", () => applyCover("0"));
    safeBindClick("cover1", () => applyCover("1"));
    safeBindClick("cover2", () => applyCover("2"));
    safeBindClick("cover3", () => applyCover("3"));
    safeBindClick("noCover", () => {
      setParam("cover", "false");
      ["0", "1", "2", "3"].forEach((k) => $("#cover" + k)?.classList.remove("active"));
      $("#noCover")?.classList.add("active");
      $$('[cover="dynamic"]').forEach((el) => el.classList.remove("cover0", "cover1", "cover2","cover3"));
      updateExtras();
      computeDesignConstraintsAndApply();
      _applyEffectiveButtonStates();
      renderPrice(window.__currentData);
    });

    safeBindClick("benefitsPage", () => toggleExtra("benefits"));
    safeBindClick("companyPage", () => toggleExtra("company"));

    safeBindClick("layout1", () => applyLayout("1"));
    safeBindClick("layout2", () => applyLayout("2"));

    safeBindClick("header1", () => applyHeader("1"));
    safeBindClick("header2", () => applyHeader("2"));

    if (!getParams().has("layout")) setParam("layout", "1");
    if (!getParams().has("header")) setParam("header", "1");
    if (!getParams().has("cover"))  setParam("cover", "0");
    if (!getParams().has("ek"))     setParam("ek", "EmployeeA");

    applyStateFromParams();

    window.addEventListener("popstate", () => {
      applyStateFromParams();
      renderPrice(window.__currentData);
    });
  });
})();
console.log("Build v2025.1.7D");
