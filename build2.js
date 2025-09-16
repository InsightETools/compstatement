/* =========================================
   Render script for the provided HTML base
   ========================================= */

// Load Status
let isLoaded = false;
console.log(isLoaded);

/* -------------------
   Utilities
------------------- */
const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class" || k === "className") node.className = v;
    else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach((c) => {
    if (c == null) return;
    node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  });
  return node;
};

function hexToRgb(hex) {
  if (!hex) return "";
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  const bigint = parseInt(hex, 16);
  if (Number.isNaN(bigint)) return "";
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
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

function renderDonutChart({ chartId, categoryGroup, containerSelector }) {
  const chartContainer = document.querySelector(`#${chartId}`);
  const legendContainer = document.querySelector(containerSelector);
  if (!chartContainer || !legendContainer || !Array.isArray(categoryGroup)) return;

  legendContainer.innerHTML = "";
  let start = 0;
  const gradientParts = [];

  categoryGroup.forEach((category) => {
    const value = parseFloat(category.value || 0);
    const color = hexToRgb(category.color);
    const end = start + value;

    const itemDiv = el("div", { category: "item", class: "moduledonutindex" }, [
      el("div", { category: "icon", class: "moduleindexcategorywrapper" }, [
        (() => {
          const swatch = el("div", { class: "chart-color" });
          if (color) swatch.style.backgroundColor = color;
          return swatch;
        })(),
        el("div", { category: "name", class: "componentsmalllabel" }, category.label || "")
      ]),
      el("div", { category: "value", class: "moduledonutindexvalue" }, `${value}%`)
    ]);

    legendContainer.appendChild(itemDiv);
    if (color) gradientParts.push(`${color} ${start}% ${end}%`);
    start = end;
  });

  chartContainer.style.background = `conic-gradient(${gradientParts.join(", ")})`;
}

/* -------------------
   Theming
------------------- */
function applyTheme(elementColor) {
  if (!elementColor) return;

  Object.entries(elementColor).forEach(([attr, color]) => {
    document.querySelectorAll(`[color="${attr}"]`).forEach((el) => {
      const elementType = el.getAttribute("element");
      if (elementType === "text") el.style.color = color;
      else if (elementType === "block") el.style.backgroundColor = color;
      else if (elementType === "stroke") el.style.borderColor = color;
    });
  });

  // Inline spans accenting
  document.querySelectorAll("span").forEach((span) => {
    if (elementColor.primaryColor) {
      span.style.color = elementColor.primaryColor;
      span.style.fontWeight = "bold";
    }
  });
}

/* -------------------
   Static data fill
------------------- */
function staticData(data, fields) {
  fields.forEach((key) => {
    document.querySelectorAll(`[data="${key}"]`).forEach((el) => {
      el.innerHTML = data[key] ?? "";
    });
  });

  // Logos & signature
  document.querySelectorAll('[data="companyLogoCover"]').forEach((el) => {
    if (data.companyLogoCover) el.setAttribute("src", data.companyLogoCover);
    if (data.companyLogoCoverHeight) el.style.height = `${data.companyLogoCoverHeight}px`;
  });

  document.querySelectorAll('[data="companyLogo"]').forEach((el) => {
    if (data.companyLogo) el.setAttribute("src", data.companyLogo);
    el.style.display = "flex";
    el.style.justifyContent = "flex-end";
  });

  const sig = document.querySelector('[data="companySignature"]');
  if (sig) {
    if (data.companySignature) sig.setAttribute("src", data.companySignature);
    else sig.style.display = "none";
  }

  // Hide greeting if no first name
  if (!data.employeeFirstName) {
    document.querySelectorAll('[static="welcome"]').forEach((el) => (el.style.display = "none"));
  }
}

/* -------------------
   Build: Standard Tables
------------------- */
function buildStandardTables(data, elementColor) {
  const px10 = { fontSize: "10px", lineHeight: "12px" };
  const pad5 = { paddingTop: "5px", paddingBottom: "5px" };

  (data.standardTables || []).forEach((table) => {
    const container = document.querySelector(`#standard${table.id}`);
    if (!container) return;

    container.innerHTML = "";

    const showCol1 = !!table.column1Name;
    const showCol2 = !!table.column2Name;
    const showCol3 = !!table.column3Name;

    // Header
    const tableNameEl = el("div", { table: "name", class: "standardtablename" }, table.name || "");
    const headerLabels = el("div", { class: "standardtablelabels" }, [
      showCol1 ? el("div", { table: "summaryHeaderCol1", class: "standardtablelabel" }, table.column1Name) : null,
      showCol2 ? el("div", { table: "summaryHeaderCol2", class: "standardtablelabel" }, table.column2Name) : null,
      showCol3 ? el("div", { table: "summaryHeaderCol3", class: "standardtablelabel" }, table.column3Name) : null,
    ]);

    const headerInner = el(
      "div",
      {
        element: "block",
        color: "tableColor",
        class: "standardtableheader",
        style: elementColor?.tableColor ? { backgroundColor: elementColor.tableColor } : {},
      },
      [tableNameEl, headerLabels]
    );

    const headerWrap = el("div", { class: "standardtablewrap" }, headerInner);
    const wrapper = el("div", { class: "standardtablewrapper" }, headerWrap);

    // Category list
    const listContainer = el("div", { table: "list", class: "standardtablelist" });

    (table.categories || []).forEach((category) => {
      const categoriesBlock = el("div", { category: "list", class: "standardtablecategories" });

      // Category header
      const catIcon = el("div", {
        category: "icon",
        chartcomp: "color",
        class: "standardtableicon",
        style: category.color ? { backgroundColor: category.color } : {},
      });
      const catName = el("div", { category: "name", class: "lineitemlabel category" }, category.label || "");
      const catNameWrap = el("div", { class: "standardtablecategoryname" }, [catIcon, catName]);
      const catHeader = el("div", { class: "standardtablecategory", style: pad5 }, catNameWrap);
      categoriesBlock.appendChild(catHeader);

      // Lines
      const lineWrapper = el("div", { class: "standardtablelinewrapper" });

      (category.items || []).forEach((lineitem, index) => {
        const lineItem = el("div", { class: `standardtablelineitem${index % 2 === 1 ? " alternate" : ""}` });

        const labelDiv = el("div", { line: "item", class: "standardtablelinelabel", style: px10 }, lineitem.label || "");
        const valuesWrap = el("div", { class: "standardtablelabels" }, [
          showCol1
            ? el("div", { line: "col1", number: "dynamic", class: "standardtablevalue", style: px10 },
                formatCurrency(lineitem.col1_value, null, table.isDecimal))
            : null,
          showCol2
            ? el("div", { line: "col2", number: "dynamic", class: "standardtablevalue", style: px10 },
                formatCurrency(lineitem.col2_value, null, table.isDecimal))
            : null,
          showCol3
            ? el("div", { line: "col3", number: "dynamic", class: "standardtablevalue", style: px10 },
                formatCurrency(lineitem.col3_value, null, table.isDecimal))
            : null,
        ]);

        lineItem.appendChild(labelDiv);
        lineItem.appendChild(valuesWrap);
        lineWrapper.appendChild(lineItem);
      });

      // Subtotal
      const subtotalWrap = el(
        "div",
        { class: "standardtablesubtotalwrapper", category: "subtotal", style: pad5 },
        [
          el("div", { class: "standardtablesubtotallabel", style: px10 }, table.totalLineName || "Total"),
          el("div", { class: "standardtablelabels" }, [
            showCol1
              ? el("div", { subtotal: "col1", number: "dynamic", class: "standardtablesubtotalvalue", style: px10 },
                  formatCurrency(category.col1_subtotal, null, table.isDecimal))
              : null,
            showCol2
              ? el("div", { subtotal: "col2", number: "dynamic", class: "standardtablesubtotalvalue", style: px10 },
                  formatCurrency(category.col2_subtotal, null, table.isDecimal))
              : null,
            showCol3
              ? el("div", { subtotal: "col3", number: "dynamic", class: "standardtablesubtotalvalue", style: px10 },
                  formatCurrency(category.col3_subtotal, null, table.isDecimal))
              : null,
          ]),
        ]
      );

      lineWrapper.appendChild(subtotalWrap);
      categoriesBlock.appendChild(lineWrapper);
      listContainer.appendChild(categoriesBlock);
    });

    wrapper.appendChild(listContainer);
    container.appendChild(wrapper);
  });
}

/* -------------------
   Build: Modules (side/main)
------------------- */
function buildModules(data, elementColor) {
  const moduleData = Array.isArray(data.modules) ? data.modules : [];
  const validIds = new Set(moduleData.map((m) => String(m.id)));

  // Hide any module placeholders with unmatched ids
  document.querySelectorAll(".moduletemplate").forEach((wrapper) => {
    const id = wrapper.id?.trim();
    if (!validIds.has(id)) wrapper.style.display = "none";
  });

  if (moduleData.length === 0) {
    document.querySelectorAll(".modulewrapper").forEach((w) => w.remove());
    return;
  }

  moduleData.forEach((mod) => {
    const container = document.getElementById(String(mod.id));
    if (!container) return;

    container.innerHTML = "";
    container.style.display = "";

    const root = el("div", { class: "modulepositiontwo" });

    // label
    const labelVal = (mod.label || "").trim();
    const labelEl  = el("div", { id: "modulelabel", module: "label", class: "modulelabel" }, labelVal);
    labelEl.style.display = labelVal ? "" : "none";

    // description
    const descVal = (mod.description || "").trim();
    const descEl  = el("p", { id: "moduledescription", module: "description", class: "moduledescription" }, descVal);
    descEl.style.display = descVal ? "" : "none";

    // list
    const listEl  = el("div", { module: "list", class: container.querySelector(".modulelistvert") ? "modulelistvert" : "modulelist" });

    let hasComponent = false;
    (mod.components || []).forEach((c) => {
      const raw = c?.value;
      if (raw === null || raw === undefined || raw === "") return;

      hasComponent = true;

      const comp = el("div", { module: "component", class: "ptoindex" });
      const compLabelVal = (c.label || "").trim();
      const compLabel = el("div", { category: "label", class: "modulesololabel" }, compLabelVal);
      compLabel.style.display = compLabelVal ? "" : "none";

      const valueWrap = el("div", { class: "ptovaluewrapper" });

      const isCurrency = c.type === "currency";
      const needsFmt   = ["currency", "number"].includes(c.type);
      const fmt        = needsFmt ? formatCurrency(raw, null, mod.isDecimal, isCurrency) : raw;

      const valueEl = el("div", {
        element: "text",
        category: "value",
        color: "secondaryColor",
        class: "modulesolovalue"
      }, String(fmt));

      if (elementColor?.secondaryColor) valueEl.style.color = elementColor.secondaryColor;

      const unitVal = (c.description || "").trim();
      const unitEl  = el("div", { category: "unit", class: "moduleindexunit dark" }, unitVal);
      unitEl.style.display = unitVal ? "" : "none";

      valueWrap.appendChild(valueEl);
      valueWrap.appendChild(unitEl);

      comp.appendChild(compLabel);
      comp.appendChild(valueWrap);

      listEl.appendChild(comp);
    });

    // disclaimer
    const discVal = (mod.disclaimer || "").trim();
    const discEl  = el("div", { module: "disclaimer", class: "ptodisclaimer" }, discVal);
    discEl.style.display = discVal ? "" : "none";

    root.appendChild(labelEl);
    root.appendChild(descEl);
    root.appendChild(listEl);
    root.appendChild(discEl);

    if (!hasComponent) {
      container.style.display = "none";
    } else {
      container.appendChild(root);
    }
  });
}

/* -------------------
   Build: Donut Charts
------------------- */
function buildDonutCharts(data) {
  const moduleWrapper = document.querySelector(".modulewrapper");
  if (!moduleWrapper || !Array.isArray(data?.charts)) return;

  data.charts.forEach((chart) => {
    const host = el("div");
    const wrapper = el("div", { id: chart.id, class: "moduledonutwrapper" });

    const labelTxt = (chart.label || "").trim();
    const descTxt  = (chart.description || "").trim();

    const labelEl  = el("div", { id: "modulelabel", category: "label", class: "modulelabel" }, labelTxt);
    const descEl   = el("p", { id: "moduledescription", category: "description", class: "moduledescription" }, descTxt);
    if (!labelTxt) labelEl.style.display = "none";
    if (!descTxt)  descEl.style.display  = "none";

    const chartDomId = `chart_${chart.id}`;
    const sizeClass  = data.chartSize || "small";
    const donutChart = el("div", { class: `moduledonutchart ${sizeClass}`, id: chartDomId }, [
      el("div", { class: "donut-center" }, [
        el("div", { class: "modulevaluelabel" }, "Total"),
        (() => {
          const totalEl = el("div", { id: "totalCompValue", number: "dynamic", category: "totalValue", class: "modulevalue" });
          totalEl.textContent = formatCurrency(chart.totalValue, totalEl, chart.isDecimal);
          return totalEl;
        })()
      ])
    ]);

    const indexWrapper = el("div", { class: "moduledonutindexwrapper" });
    (chart.groups || []).forEach((g) => {
      indexWrapper.appendChild(
        el("div", { category: "item", class: "moduledonutindex" }, [
          el("div", { category: "icon", class: "moduleindexcategorywrapper" }, [
            (() => {
              const swatch = el("div", { class: "chart-color" });
              const c = hexToRgb(g.color);
              if (c) swatch.style.backgroundColor = c;
              return swatch;
            })(),
            el("div", { category: "name", class: "componentsmalllabel" }, g.label || "")
          ]),
          el("div", { category: "value", class: "moduledonutindexvalue" }, `${parseFloat(g.value || 0)}%`)
        ])
      );
    });

    const disclaimerTxt = (chart.disclaimer || "").trim();
    const disclaimer = el("p", { category: "disclaimer", class: "moduledisclaimer" }, disclaimerTxt);
    if (!disclaimerTxt) disclaimer.style.display = "none";

    wrapper.appendChild(labelEl);
    wrapper.appendChild(descEl);
    wrapper.appendChild(donutChart);
    wrapper.appendChild(indexWrapper);
    wrapper.appendChild(disclaimer);

    host.appendChild(wrapper);
    moduleWrapper.appendChild(host);

    renderDonutChart({
      chartId: chartDomId,
      categoryGroup: chart.groups || [],
      containerSelector: `#${chartDomId} + .moduledonutindexwrapper`,
    });
  });
}

/* -------------------
   Optional lists if present
------------------- */
function benefitsList(data) {
  const container = document.querySelector('[benefit="list"]');
  const template  = container?.querySelector('[benefit="wrapper"]');
  if (!container || !template || !Array.isArray(data?.benefits)) return;

  container.innerHTML = "";
  data.benefits.forEach((benefit) => {
    const node = template.cloneNode(true);
    const nameEl = node.querySelector('[benefit="name"]');
    const descEl = node.querySelector('[benefit="description"]');
    if (nameEl) nameEl.textContent = benefit.name || "";
    if (descEl) {
      descEl.innerHTML = benefit.description || "";
      const cls = descEl.className;
      descEl.querySelectorAll("li").forEach((li) => (li.className = cls));
    }
    container.appendChild(node);
  });
}

function holidaysList(data) {
  const list = document.querySelector(".holidaylist");
  const item = list?.querySelector(".holidaywrapper");
  if (!list || !item || !Array.isArray(data?.holidays)) return;

  list.innerHTML = "";
  data.holidays.forEach((h) => {
    const node = item.cloneNode(true);
    const d1 = node.querySelector(".holidayweekday");
    const d2 = node.querySelector(".holidaydate");
    const d3 = node.querySelector(".holidayname");
    if (d1) d1.textContent = h.weekday || "";
    if (d2) d2.textContent = h.date || "";
    if (d3) d3.textContent = h.name || "";
    list.appendChild(node);
  });
}

function contactsLists(contactsData, listSelector) {
  if (!Array.isArray(contactsData)) return;
  const listContainer = document.querySelector(`${listSelector} [contacts="list"]`);
  const itemTemplate  = listContainer?.querySelector('[contact="wrapper"]');
  if (!listContainer || !itemTemplate) return;

  listContainer.innerHTML = "";
  contactsData.forEach((c, idx) => {
    const node = itemTemplate.cloneNode(true);
    if (idx % 2 === 1) node.classList.add("alternate");
    const n = node.querySelector('[contact="name"]');
    const d = node.querySelector('[contact="description"]');
    const a = node.querySelector('[contact="link"]');
    if (n) n.textContent = c.name || "";
    if (d) d.textContent = c.description || "";
    if (a) {
      a.textContent = c.contact || "";
      a.href = c.url || "#";
    }
    listContainer.appendChild(node);
  });
}

/* -------------------
   Display/flow helpers
------------------- */
function loadDisplay(data) {
  const loader = document.getElementById("loadElement");
  loader?.classList.add("loaded");

  const renderParam = new URLSearchParams(window.location.search).get("render");
  if (renderParam === "true") {
    const body = document.body;
    body.classList.remove("design");
    body.classList.add("render");

    const pages = Array.from(document.querySelectorAll('[element="page"]'));
    pages.forEach((p) => body.appendChild(p));

    Array.from(body.children).forEach((child) => {
      if (!pages.includes(child)) body.removeChild(child);
    });

    Array.from(body.childNodes).forEach((n) => {
      if (n.nodeType !== Node.ELEMENT_NODE) body.removeChild(n);
    });
  }

  const coverEl = document.querySelector("#pageCover");
  if (coverEl) coverEl.style.display = data.coverSheet === false ? "none" : "";
}

function listModule(data, elementColor) {
  function buildListModule({
    label = "Additional Benefits",
    details = "",
    values = ["[Bullet Point]"],
    orientation = "vertical",
    color = elementColor?.tableColor,
    height = null,
  } = {}) {
    const heading = el("div", { data: "label", class: "listmoduleheading" }, label);
    const header  = el("div", { module: "header", class: "listmoduleheader" }, heading);
    if (color) header.style.backgroundColor = color;

    const detailsEl = el("div", { data: "details", class: "listdescription" });
    if (details) detailsEl.textContent = details;
    else detailsEl.style.display = "none";

    const ul = el("ul", { data: "values", role: "list", class: "listitemline" });
    (values || []).forEach((val) => {
      const li = el("li", { data: "value", class: "listitemtext" });
      li.innerHTML = val;
      ul.appendChild(li);
    });

    const listItems   = el("div", { module: "listItems", class: "listitemitems w-richtext" }, ul);
    const listWrapper = el("div", { module: "list", class: `listmodulelist ${orientation}` }, [detailsEl, listItems]);
    const template    = el("div", { module: "template", class: "listmoduletemplate" }, [header, listWrapper]);

    if (height && !isNaN(height)) template.style.minHeight = `${height}px`;
    return template;
  }

  (data.listModule || []).forEach((item) => {
    const target = document.getElementById(String(item.id));
    if (!target) {
      console.warn(`listModule: No element found with id="${item.id}"`);
      return;
    }

    const card = buildListModule({
      label: item.label,
      details: item.details,
      values: item.values,
      orientation: "vertical",
      color: elementColor?.tableColor,
      height: item.height,
    });

    target.appendChild(card);
  });
}

function autoFitPages() {
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
}

/* -------------------
   Demo toolbar wiring
------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const qs  = () => new URLSearchParams(window.location.search);
  const nav = (pathname, params) => {
    const hash = window.location.hash;
    window.location.href = pathname + "?" + params.toString() + hash;
  };

  const designBtns = document.querySelectorAll('[id^="design-"]');
  designBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idNum = btn.id.split("-")[1];
      nav(`/design/design-${idNum}`, qs());
    });
  });

  const empBtns = document.querySelectorAll('[id^="employee-"]');
  empBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const idNum = btn.id.split("-")[1];
      const params = qs();
      params.set("ek", idNum);
      nav(window.location.pathname, params);
    });
  });

  const pathMatch = window.location.pathname.match(/design-(\d+)$/);
  if (pathMatch) {
    const activeDesign = document.getElementById(`design-${pathMatch[1]}`);
    if (activeDesign) {
      designBtns.forEach((b) => b.classList.toggle("active", b === activeDesign));
    }
  }
  const ek = qs().get("ek");
  if (ek) {
    const activeEmp = document.getElementById(`employee-${ek}`);
    if (activeEmp) empBtns.forEach((b) => b.classList.toggle("active", b === activeEmp));
  }

  const demoEl = document.getElementById("demo");
  if (demoEl) demoEl.style.display = qs().get("demo") === "true" ? "" : "none";
});

/* -------------------
   Main bootstrap
------------------- */
document.addEventListener("DOMContentLoaded", () => {
  // query params
  const urlParams = new URLSearchParams(window.location.search);
  const key  = urlParams.get("key");
  const cpid = urlParams.get("cpid");
  const yr   = urlParams.get("yr");
  const ck   = urlParams.get("ck");
  const ek   = urlParams.get("ek");
  const test = urlParams.get("test");

  const baseUrl = "https://etools.secure-solutions.biz/totalcompadmin/design/ClientParamsFlat1.aspx";
  const queryParams = new URLSearchParams({ usecors: "1", key, cpid, yr, ck, ek }).toString();
  const fetchUrl = test ? "https://compstatementdemo.netlify.app/test.json" : `${baseUrl}?${queryParams}`;

  fetch(fetchUrl)
    .then((r) => r.json())
    .then((data) => {
      document.title = data.companyName || document.title;

      const elementColor = {
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        tableColor: data.tableColor,
      };

      const statementFields = [
        "companyName",
        "companyRepName",
        "companyRepTitle",
        "companyRepSignature",
        "companySignatureText",
        "companySignature",
        "companyAttn",
        "companyAddress",
        "companyUnit",
        "companyCity",
        "companyState",
        "companyZip",
        "companyWelcome",
        "companyMessage",
        "employeeName",
        "employeeFirstName",
        "employeeAddress",
        "employeeUnit",
        "employeeCity",
        "employeeState",
        "employeeZip",
        "statementTitle",
        "statementRange",
        "statementYear",
        "statementDisclaimer",
        "lookbackYear",
        "lookbackMessage",
        "lookaheadYear",
        "lookaheadMessage",
        "employeeTitle",
        "employeeSalary",
      ];

      applyTheme(elementColor);
      staticData(data, statementFields);

      buildStandardTables(data, elementColor);
      buildModules(data, elementColor);
      buildDonutCharts(data);

      // Optional data blocks (only run if matching DOM exists)
      benefitsList(data);
      holidaysList(data);
      contactsLists(data.companyContacts, '[contacts="company"]');
      contactsLists(data.benefitContacts, '[contacts="providers"]');

      loadDisplay(data);
      listModule(data, elementColor);

      // Overflow autosize
      autoFitPages();

      isLoaded = true;
      console.log(isLoaded);
    })
    .catch((error) => {
      const errorCheck = error?.message?.includes?.("Unexpected token");
      alert(errorCheck ? "No User Found" : error);
    });
});
