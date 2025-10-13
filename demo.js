// Load Status
let isLoaded = false;
console.log(isLoaded === false ? "Initializing" : "Initialize Failed");

document.addEventListener("DOMContentLoaded", () => {
  const qs = () => new URLSearchParams(window.location.search);
  const nav = (pathname, params) => {
    const hash = window.location.hash;
    window.location.href = pathname + "?" + params.toString() + hash;
  };

  const params = qs();

  // Handle Design Buttons
  const designBtns = document.querySelectorAll('[id^="design-"]');
  if (designBtns.length) {
    designBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idNum = btn.id.split("-")[1];
        nav(`/design/design-${idNum}`, params);
      });
    });

    const pathMatch = window.location.pathname.match(/design-(\d+)$/);
    if (pathMatch) {
      const activeDesign = document.getElementById(`design-${pathMatch[1]}`);
      if (activeDesign) {
        designBtns.forEach((b) =>
          b.classList.toggle("active", b === activeDesign)
        );
      }
    }
  }

  // Handle Employee Buttons
  const empBtns = document.querySelectorAll('[id^="employee-"]');
  if (empBtns.length) {
    empBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const idNum = btn.id.split("-")[1];
        const newParams = new URLSearchParams(window.location.search);
        newParams.set("ek", idNum);
        nav(window.location.pathname, newParams);
      });
    });

    const ek = params.get("ek");
    if (ek) {
      const activeEmp = document.getElementById(`employee-${ek}`);
      if (activeEmp) {
        empBtns.forEach((b) => b.classList.toggle("active", b === activeEmp));
      }
    }
  }

  // Handle Demo Element
  const demoEl = document.getElementById("demo");
  if (demoEl) {
    demoEl.style.display = params.get("demo") === "true" ? "" : "none";
  }
});

// Convert HEX to RGB string
function hexToRgb(hex) {
  hex = hex.replace(/^#/, "");
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgb(${r}, ${g}, ${b})`;
}

// Format numbers to currency strings
function formatCurrency(
  value,
  element = null,
  decimalFlag = null,
  isCurrency = true
) {
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

// Render donut chart with gradient and legend
function renderDonutChart({ chartId, categoryGroup, containerSelector }) {
  const chartContainer = document.getElementById(chartId);
  const legendContainer = document.querySelector(containerSelector);

  if (!chartContainer || !legendContainer || !Array.isArray(categoryGroup))
    return;

  legendContainer.innerHTML = "";

  let start = 0;
  const gradientParts = [];

  categoryGroup.forEach((category) => {
    const value = parseFloat(category.value);
    const color = hexToRgb(category.color);
    const end = start + value;

    // Create item layout
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

  chartContainer.style.background = `conic-gradient(${gradientParts.join(
    ", "
  )})`;
}

// Apply color values from a map to cloned element
function applyElementColors(clone, colorMap) {
  if (!clone || !colorMap) return;

  clone.querySelectorAll("[element]").forEach((el) => {
    const type = el.getAttribute("element");
    const colorKey = el.getAttribute("color");
    const cssColor = colorMap[colorKey];
    if (!cssColor) return;

    if (type === "text") {
      el.style.color = cssColor;
    } else if (type === "block") {
      el.style.backgroundColor = cssColor;
    } else if (type === "stroke") {
      el.style.borderColor = cssColor;
    }
  });
}

//Execute Tasks
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);

  if (!urlParams.has("ek")) {
    urlParams.set("ek", "EmployeeA");
    const newUrl = `${window.location.pathname}?${urlParams.toString()}${
      window.location.hash
    }`;
    window.location.replace(newUrl);
    return;
  }

  const key = urlParams.get("key");
  const cpid = urlParams.get("cpid");
  const yr = urlParams.get("yr");
  const ck = urlParams.get("ck");
  const ek = urlParams.get("ek");
  const test = urlParams.get("test");
  let baseUrl;
  let fetchUrl;
  let queryParams;

  baseUrl =
    "https://etools.secure-solutions.biz/totalcompadmin/design/ClientParamsExplorer.aspx";
  queryParams = new URLSearchParams({
    usecors: "1",
    key,
    cpid,
    yr,
    ck,
    ek,
  }).toString();

  if (!key) {
    fetchUrl = `https://compstatementdemo.netlify.app/${ek}.json`;
  } else {
    fetchUrl = `${baseUrl}?${queryParams}`;
  }

  fetch(fetchUrl)
    .then((response) => response.json())
    .then((data) => {
      // === JSON-driven button enable/disable ===
      function applyButtonStatus() {
        if (!data.buttonStatus || typeof data.buttonStatus !== "object") return;
        Object.entries(data.buttonStatus).forEach(([key, value]) => {
          const btn = document.getElementById(key);
          if (!btn) return;
          const disabled = !value;
          btn.classList.toggle("disabled", disabled);
          btn.toggleAttribute("disabled", disabled);
          btn.setAttribute("aria-disabled", String(disabled));
        });
      }

      // === Link applicators ===
      // Company URL -> [data="companyURL"]
      function applyCompanyURL() {
        const url = data?.companyURL;
        if (!url) return;
        document.querySelectorAll('[data="companyURL"]').forEach((el) => {
          if ("href" in el) el.href = url;
          else el.setAttribute("href", url);
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
        });
      }

      // Explorer URL -> [data="explorerUrl"]
      function applyExplorerURL() {
        const url = data?.explorerUrl;
        if (!url) return;
        document.querySelectorAll('[data="explorerUrl"]').forEach((el) => {
          if ("href" in el) el.href = url;
          else el.setAttribute("href", url);
          el.setAttribute("target", "_blank");
          el.setAttribute("rel", "noopener noreferrer");
        });
      }

      // === Cover Content (array of image URLs) ===
      function applyCoverContent() {
        const arr = Array.isArray(data?.coverContent)
          ? data.coverContent
          : null;
        if (!arr || arr.length === 0) return;

        const templateImg = document.querySelector('img[data="coverContent"]');
        if (!templateImg) return;

        // Clear existing siblings inside the same parent if multiple runs
        const parent = templateImg.parentElement;
        if (!parent) return;
        parent.querySelectorAll('img[data="coverContent"]').forEach((n, i) => {
          if (i > 0) n.remove();
        });

        // First one uses the template
        templateImg.src = arr[0];

        // Create the rest
        for (let i = 1; i < arr.length; i++) {
          const clone = templateImg.cloneNode(true);
          clone.src = arr[i];
          parent.appendChild(clone);
        }
      }

      const statementElement = [
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
        "hireDate",
        "position"
      ];

      const elementColor = {
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor,
        tableColor: data.tableColor,
      };

      //Apply Colors
      Object.entries(elementColor).forEach(([attr, color]) => {
        document.querySelectorAll(`[color="${attr}"]`).forEach((el) => {
          const elementType = el.getAttribute("element");
          if (elementType === "text") {
            el.style.color = color;
          } else if (elementType === "block") {
            el.style.backgroundColor = color;
          } else if (elementType === "stroke") {
            el.style.borderColor = elementColor.primaryColor;
          }
        });
      });

      function staticData(data, statementElement) {
        statementElement.forEach((key) => {
          document.querySelectorAll(`[data="${key}"]`).forEach((el) => {
            el.innerHTML = data[key] || "";
          });
        });

        document.querySelectorAll('[data="companyLogoCover"]').forEach((el) => {
          el.setAttribute("src", data.companyLogoCover);
          el.style.height = data.companyLogoCoverHeight + "px";
        });

        document.querySelectorAll('[data="companyLogo"]').forEach((el) => {
          el.setAttribute("src", data.companyLogo);
          el.style.display = "flex";
          el.style.justifyContent = "flex-end";
        });

        document.querySelectorAll('[data="explorerLogo"]').forEach((el) => {
          el.setAttribute("src", data.explorerLogo);
          el.style.display = "flex";
          el.style.justifyContent = "flex-end";
        });

        const signatureElements = document.querySelectorAll(
          '[data="companySignature"]'
        );
        if (!data.companySignature || !signatureElements.length) {
          signatureElements.forEach((el) => (el.style.display = "none"));
        } else {
          signatureElements.forEach((el) => {
            el.setAttribute("src", data.companySignature);
            el.style.display = "";
          });
        }
      }

      if (statementElement.companyWelcome)
        document.querySelectorAll(`[static="welcome"]`).forEach((el) => {
          el.style.display = "none";
        });

      function standardTables(data) {
        const categoryEntryTemplate = document.querySelector("#categoryEntry");
        const baseTableTemplate = document.querySelector("#tableTemplate");
        const tableContent = baseTableTemplate.querySelector(
          ".standardtablewrapper"
        );

        if (!categoryEntryTemplate || !baseTableTemplate || !tableContent) {
          console.error("No Standard Table Slots Found");
          return;
        }

        data.standardTables.forEach((table) => {
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

            const headerCol1 = tableWrapper.querySelector(
              '[table="summaryHeaderCol1"]'
            );
            const headerCol2 = tableWrapper.querySelector(
              '[table="summaryHeaderCol2"]'
            );
            const headerCol3 = tableWrapper.querySelector(
              '[table="summaryHeaderCol3"]'
            );

            if (!showCol1 && headerCol1) headerCol1.remove();
            else if (headerCol1) headerCol1.textContent = table.column1Name;

            if (!showCol2 && headerCol2) headerCol2.remove();
            else if (headerCol2) headerCol2.textContent = table.column2Name;

            if (!showCol3 && headerCol3) headerCol3.remove();
            else if (headerCol3) headerCol3.textContent = table.column3Name;

            const categoryListContainer =
              tableWrapper.querySelector(".standardtablelist");

            table.categories.forEach((category) => {
              const categoryClone = categoryEntryTemplate.cloneNode(true);
              categoryClone.removeAttribute("id");

              const existingList = categoryClone.querySelector("#categoryList");
              if (existingList) existingList.remove();

              const existingSubtotal = categoryClone.querySelector(
                '[category="subtotal"]'
              );
              if (existingSubtotal) existingSubtotal.remove();

              const categoryName =
                categoryClone.querySelector('[category="name"]');
              const categoryIcon =
                categoryClone.querySelector('[category="icon"]');
              if (categoryIcon)
                categoryIcon.style.backgroundColor = category.color;
              if (categoryName) categoryName.textContent = category.label;

              const categoryList = document.createElement("div");
              categoryList.classList.add("standardtablelinewrapper");

              category.items.forEach((lineitem, index) => {
                const lineClone = document.createElement("div");
                lineClone.classList.add("standardtablelineitem");
                if (index % 2 === 1) lineClone.classList.add("alternate");

                const labelDiv = document.createElement("div");
                labelDiv.setAttribute("line", "item");
                labelDiv.className = "standardtablelinelabel";
                labelDiv.textContent = lineitem.label;

                const valueWrapper = document.createElement("div");
                valueWrapper.className = "standardtablelabels";

                if (showCol1) {
                  const col1Div = document.createElement("div");
                  col1Div.setAttribute("line", "col1");
                  col1Div.setAttribute("number", "dynamic");
                  col1Div.className = "standardtablevalue";
                  col1Div.textContent = formatCurrency(
                    lineitem.col1_value,
                    col1Div,
                    table.isDecimal
                  );
                  valueWrapper.appendChild(col1Div);
                }

                if (showCol2) {
                  const col2Div = document.createElement("div");
                  col2Div.setAttribute("line", "col2");
                  col2Div.setAttribute("number", "dynamic");
                  col2Div.className = "standardtablevalue";
                  col2Div.textContent = formatCurrency(
                    lineitem.col2_value,
                    col2Div,
                    table.isDecimal
                  );
                  valueWrapper.appendChild(col2Div);
                }

                if (showCol3) {
                  const col3Div = document.createElement("div");
                  col3Div.setAttribute("line", "col3");
                  col3Div.setAttribute("number", "dynamic");
                  col3Div.className = "standardtablevalue";
                  col3Div.textContent = formatCurrency(
                    lineitem.col3_value,
                    col3Div,
                    table.isDecimal
                  );
                  valueWrapper.appendChild(col3Div);
                }

                lineClone.appendChild(labelDiv);
                lineClone.appendChild(valueWrapper);
                categoryList.appendChild(lineClone);
              });

              const subtotalClone = document.createElement("div");
              subtotalClone.classList.add("standardtablesubtotalwrapper");
              subtotalClone.setAttribute("category", "subtotal");

              const subLabel = document.createElement("div");
              subLabel.className = "standardtablesubtotallabel";
              subLabel.textContent = table.totalLineName || "Subtotal";

              const subWrapper = document.createElement("div");
              subWrapper.className = "standardtablelabels";

              if (showCol1) {
                const subCol1 = document.createElement("div");
                subCol1.setAttribute("subtotal", "col1");
                subCol1.setAttribute("number", "dynamic");
                subCol1.className = "standardtablesubtotalvalue";
                subCol1.textContent = formatCurrency(
                  category.col1_subtotal,
                  subCol1,
                  table.isDecimal
                );
                subWrapper.appendChild(subCol1);
              }

              if (showCol2) {
                const subCol2 = document.createElement("div");
                subCol2.setAttribute("subtotal", "col2");
                subCol2.setAttribute("number", "dynamic");
                subCol2.className = "standardtablesubtotalvalue";
                subCol2.textContent = formatCurrency(
                  category.col2_subtotal,
                  subCol2,
                  table.isDecimal
                );
                subWrapper.appendChild(subCol2);
              }

              if (showCol3) {
                const subCol3 = document.createElement("div");
                subCol3.setAttribute("subtotal", "col3");
                subCol3.setAttribute("number", "dynamic");
                subCol3.className = "standardtablesubtotalvalue";
                subCol3.textContent = formatCurrency(
                  category.col3_subtotal,
                  subCol3,
                  table.isDecimal
                );
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

      function booleanTables(data) {
        const tableTemplate = document.querySelector("#booleanTableTemplate");
        const rowTemplateWrapper = document.querySelector(
          "#booleanCategoryEntry"
        );
        const rowTemplate =
          rowTemplateWrapper?.querySelector('[category="line"]');

        if (!tableTemplate || !rowTemplateWrapper || !rowTemplate) {
          console.error(`No Boolean Table Slot Found`);
          return;
        }

        rowTemplateWrapper.style.display = "none";

        function createBoolSVG(value, cell) {
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
        }

        const columnMap = {
          column0Name: "zero",
          columnBoolName: "bool",
          column1Name: "one",
          column2Name: "two",
          column3Name: "three",
        };

        data.booleanTables.forEach((tableData) => {
          const container = document.querySelector(`#${tableData.id}`);
          if (!container) return;

          container.innerHTML = "";

          const tableClone = tableTemplate.cloneNode(true);
          tableClone.removeAttribute("id");

          const hiddenColumns = [];

          for (const [labelKey, columnAttr] of Object.entries(columnMap)) {
            const labelValue = tableData[labelKey];
            const isMissing =
              labelValue == null || String(labelValue).trim() === "";

            if (isMissing) {
              hiddenColumns.push(columnAttr);
              tableClone
                .querySelectorAll(`[column="${columnAttr}"]`)
                .forEach((el) => el.remove());
            } else {
              const totalKey = labelKey.replace("Name", "Total");
              const totalEl = tableClone.querySelector(`[table="${totalKey}"]`);
              if (totalEl) {
                totalEl.setAttribute("number", "dynamic");
                totalEl.textContent = formatCurrency(
                  tableData[totalKey],
                  totalEl,
                  tableData.isDecimal
                );
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

            if (index % 2 === 1) {
              rowClone.classList.add("alternate");
            }

            Object.entries(itemData).forEach(([key, value]) => {
              const cell = rowClone.querySelector(`[line="${key}"]`);

              const match = key.match(/^col(\d+|Bool|0)_/i);
              if (match) {
                const idx = match[1].toLowerCase();
                const columnAttr =
                  idx === "0"
                    ? "zero"
                    : idx === "bool"
                    ? "bool"
                    : idx === "1"
                    ? "one"
                    : idx === "2"
                    ? "two"
                    : idx === "3"
                    ? "three"
                    : "";

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
                cell.textContent = formatCurrency(
                  value,
                  cell,
                  tableData.isDecimal
                );
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
              el.textContent = formatCurrency(
                parseFloat(value),
                el,
                tableData.isDecimal
              );
            });
        });
      }

      function modules(data) {
        if (!Array.isArray(data.modules) || data.modules.length === 0) {
          const moduleWrappers = document.querySelectorAll(".moduletemplate");
          moduleWrappers.forEach((el) => (el.style.display = "none"));
          return;
        }

        const moduleData = data.modules || [];
        const validIds = new Set(moduleData.map((mod) => mod.id));

        const allModuleContainers =
          document.querySelectorAll(".moduletemplate");
        allModuleContainers.forEach((el) => {
          const id = el.id?.trim();
          if (!validIds.has(id)) {
            el.style.display = "none";
          }
        });

        moduleData.forEach((module) => {
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

            const descEl = moduleContainer.querySelector(
              '[module="description"]'
            );
            if (descEl) {
              const value = module.description || "";
              descEl.textContent = value;
              descEl.style.display = value.trim() ? "" : "none";
            }

            const disclaimerEl = moduleContainer.querySelector(
              '[module="disclaimer"]'
            );
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

            module.components.forEach((component) => {
              const value = component.value;
              const isEmpty =
                value === null || value === undefined || value === "";
              if (isEmpty) return;

              const componentClone = template.cloneNode(true);
              componentClone.style.display = "";
              componentClone.removeAttribute("id");

              const labelComponentEl =
                componentClone.querySelector('[category="label"]');
              if (labelComponentEl) {
                labelComponentEl.textContent = component.label || "";
                labelComponentEl.style.display = component.label?.trim()
                  ? ""
                  : "none";
              }

              const valueEl =
                componentClone.querySelector('[category="value"]');
              if (valueEl) {
                const isCurrency = component.type === "currency";
                const needsFormatting = ["currency", "number"].includes(
                  component.type
                );
                const formattedValue = needsFormatting
                  ? formatCurrency(value, valueEl, module.isDecimal, isCurrency)
                  : value;
                valueEl.textContent = formattedValue;
              }

              const unitEl = componentClone.querySelector('[category="unit"]');
              if (unitEl) {
                unitEl.textContent = component.description || "";
                unitEl.style.display = component.description?.trim()
                  ? ""
                  : "none";
              }

              listEl.appendChild(componentClone);
              hasValidComponent = true;
            });

            template.style.display = "none";

            if (!hasValidComponent) {
              moduleContainer.style.display = "none";
            }
          });
        });
      }

      function donutCharts(data) {
        const donutTemplate = document.getElementById("moduleDonutTemplate");
        const moduleWrapper = document.querySelector(".modulewrapper");

        if (!donutTemplate || !moduleWrapper) {
          console.error(`No Donut Chart Slot Found`);
          return;
        }

        data.charts.forEach((chart) => {
          const clone = donutTemplate.cloneNode(true);
          clone.style.display = "";
          clone.id = "";

          const chartId = `chart_${chart.id}`;
          const chartEl = clone.querySelector(".moduledonutchart");
          chartEl.id = chartId;
          chartEl.classList.add(data.chartSize || "small");

          clone.querySelector('[category="label"]').textContent = chart.label;
          clone.querySelector('[category="description"]').textContent =
            chart.description;
          clone.querySelector('[category="disclaimer"]').textContent =
            chart.disclaimer;

          const totalEl = clone.querySelector('[category="totalValue"]');
          totalEl.textContent = formatCurrency(
            chart.totalValue,
            totalEl,
            chart.isDecimal
          );

          const indexWrapper = clone.querySelector(".moduledonutindexwrapper");
          chart.groups.forEach((group) => {
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

          moduleWrapper.appendChild(clone);

          renderDonutChart({
            chartId,
            categoryGroup: chart.groups,
            containerSelector: `#${chartId} + .moduledonutindexwrapper`,
          });
        });

        donutTemplate.remove();
      }

      function benefitsList(data) {
        const listContainer = document.querySelector('[benefit="list"]');
        const wrapperTemplate = listContainer?.querySelector(
          '[benefit="wrapper"]'
        );

        if (!listContainer || !wrapperTemplate) {
          return;
        }
        listContainer.innerHTML = "";

        data.benefits.forEach((benefit) => {
          const wrapperClone = wrapperTemplate.cloneNode(true);

          const nameEl = wrapperClone.querySelector('[benefit="name"]');
          const descEl = wrapperClone.querySelector('[benefit="description"]');

          if (nameEl) nameEl.textContent = benefit.name || "";
          if (descEl) {
            descEl.innerHTML = benefit.description || "";

            const paragraphClass = descEl.className;
            const listItems = descEl.querySelectorAll("li");
            listItems.forEach((li) => {
              li.className = paragraphClass;
            });
          }

          listContainer.appendChild(wrapperClone);
        });
      }

      function holidaysList(data) {
        const holidayList = document.querySelector(".holidaylist");
        const holidayTemplate = holidayList?.querySelector(".holidaywrapper");

        if (!holidayList || !holidayTemplate) {
          console.error("No Holiday Slot Found");
          return;
        }

        holidayList.innerHTML = "";

        data.holidays.forEach((holiday) => {
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

      function contactsLists(contactsData, listSelector) {
        const listContainer = document.querySelector(
          `${listSelector} [contacts="list"]`
        );
        const itemTemplate = listContainer?.querySelector(
          '[contact="wrapper"]'
        );

        if (!listContainer || !itemTemplate) {
          console.error(`No Contact List Slot Found`);
          return;
        }

        listContainer.innerHTML = "";

        contactsData.forEach((contact, index) => {
          const itemClone = itemTemplate.cloneNode(true);

          if (index % 2 === 1) {
            itemClone.classList.add("alternate");
          }

          const nameEl = itemClone.querySelector('[contact="name"]');
          const descEl = itemClone.querySelector('[contact="description"]');
          const linkEl = itemClone.querySelector('[contact="link"]');

          if (nameEl) nameEl.textContent = contact.name || "";
          if (descEl) descEl.textContent = contact.description || "";
          if (linkEl) {
            linkEl.textContent = contact.contact || "";
            linkEl.href = contact.url || "#";
          }

          listContainer.appendChild(itemClone);
        });
      }

      function loadDisplay(data) {
        const renderParam = new URLSearchParams(window.location.search).get(
          "render"
        );
        if (renderParam === "true") {
          const body = document.body;
          body.classList.remove("design");
          body.classList.add("render");

          const pageElements = Array.from(
            document.querySelectorAll('[element="page"]')
          );
          pageElements.forEach((el) => body.appendChild(el));

          Array.from(body.children).forEach((child) => {
            if (!pageElements.includes(child)) {
              body.removeChild(child);
            }
          });

          Array.from(body.childNodes).forEach((node) => {
            if (node.nodeType !== Node.ELEMENT_NODE) {
              body.removeChild(node);
            }
          });
        }

        const params = new URLSearchParams(window.location.search);
        const getCurrentDesign = () => params.get("design") || "1";
        const coverParam = params.get("cover") ?? "0";
        const isDesign2 = getCurrentDesign() === "2";

        const showCover = coverParam !== "false" && !isDesign2;

        const coverEl = document.querySelector("#pageCover");
        if (coverEl) {
          coverEl.style.display = showCover ? "" : "none";
        }

        setTimeout(() => {
          const loader = document.getElementById("loader");
          if (loader) {
            loader.classList.add("finished");
          }
        }, 500);
      }

      function standaloneDisclaimer(disclaimer, id) {
        const container = document.querySelector(`#${id}`);
        const standDisclaimer = document.createElement("div");
        standDisclaimer.className = "benefitdescription";
        standDisclaimer.textContent = disclaimer;
        container.appendChild(standDisclaimer);
      }

      // --- Render pipeline ---
      staticData(data, statementElement);
      standardTables(data);
      booleanTables(data);
      modules(data);
      donutCharts(data);
      benefitsList(data);
      holidaysList(data);
      contactsLists(data.companyContacts, '[contacts="company"]');
      contactsLists(data.benefitContacts, '[contacts="providers"]');
      applyCompanyURL();
      applyExplorerURL();
      applyCoverContent();
      loadDisplay(data);

      const spans = document.querySelectorAll("span");
      spans.forEach((span) => {
        span.style.color = elementColor.primaryColor;
        span.style.fontWeight = "bold";
        const dataKey = span.getAttribute("data");
        if (dataKey && data[dataKey] !== undefined) {
          span.textContent = data[dataKey];
        }
      });

      const primaryColors = document.querySelectorAll('[color="primaryColor"]');
      primaryColors.forEach((el) => {
        el.style.color = elementColor.primaryColor;
      });

      const secondaryColors = document.querySelectorAll(
        '[color="secondaryColor"]'
      );
      secondaryColors.forEach((el) => {
        el.style.color = elementColor.secondaryColor;
      });

      //Check Overflow
// Check Overflow (extracted to a global so we can call it after layout changes)
window.applyOverflow = function () {
  document.querySelectorAll('[item="page"]').forEach((page) => {
    const lineElements = page.querySelectorAll(
      ".standardtablelinelabel, .standardtablevalue, .standardtablesubtotallabel, .standardtablesubtotalvalue"
    );

    const blockElements = page.querySelectorAll(
      ".standardtablesubtotalwrapper, .standardtablecategory"
    );

    const maxFontSize = 10;
    const minFontSize = 8;
    let fontSize = maxFontSize;

    const maxLineHeight = 12;
    const minLineHeight = 8;
    let lineHeight = maxLineHeight;

    const maxBlockSpacing = 5;
    const minBlockSpacing = 2;
    let blockSpacing = maxBlockSpacing;

    const applyStyles = () => {
      lineElements.forEach((el) => {
        el.style.fontSize = `${fontSize}px`;
        el.style.lineHeight = `${lineHeight}px`;
      });

      blockElements.forEach((el) => {
        el.style.paddingTop = `${blockSpacing}px`;
        el.style.paddingBottom = `${blockSpacing}px`;
      });
    };

    const isOverflowing = () => {
      const pageRect = page.getBoundingClientRect();
      return Array.from(page.children).some((child) => {
        const childRect = child.getBoundingClientRect();
        return (
          childRect.bottom > pageRect.bottom || childRect.right > pageRect.right
        );
      });
    };

    applyStyles();

    while (
      isOverflowing() &&
      (fontSize > minFontSize ||
        lineHeight > minLineHeight ||
        blockSpacing > minBlockSpacing)
    ) {
      if (fontSize > minFontSize) fontSize -= 1;
      if (lineHeight > minLineHeight) lineHeight -= 1;
      if (blockSpacing > minBlockSpacing) blockSpacing -= 1;
      applyStyles();
    }
  });
};

// Run once after initial render
window.applyOverflow();


      // Apply JSON button status (disables + inert behavior)
      applyButtonStatus();

      // Load Status Finished
      isLoaded = true;
      if (isLoaded == true) {
        console.log("Finished");
      } else {
        console.log("Loading Failed");
      }
    })
    .catch((error) => {
      const errorCheck = error.message.includes("Unexpected token");
      alert(errorCheck ? "No User Found" : error);
    });
});

(() => {
  // Utility functions for selecting elements
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => document.querySelectorAll(sel);
  const params = new URLSearchParams(window.location.search);
  let scale = 1; // Initial zoom level

  // Disable guard helpers
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

  // Update the URL parameter without reloading the page (preserve hash)
  const setParam = (key, value) => {
    params.set(key, value);
    history.replaceState(
      null,
      "",
      `${location.pathname}?${params.toString()}${location.hash}`
    );
  };

  // Toggle "active" class for an element
  const toggleActive = (id, isActive) =>
    qs("#" + id)?.classList.toggle("active", isActive);

  // Helpers to read current params
  const getCurrentDesign = () => params.get("design") || "1";
  const getCurrentLayout = () => params.get("layout") || "1";
  const getCurrentHeader = () => params.get("header") || "1";
  const getCurrentCover = () => params.get("cover") ?? "0"; // "0" | "1" | "2" | "false"

  // Enable/disable layout buttons by class only
  const setLayoutButtonsDisabled = (disabled) => {
    qs("#layout1")?.classList.toggle("disabled", disabled);
    qs("#layout2")?.classList.toggle("disabled", disabled);
    qs("#layout1")?.toggleAttribute("disabled", disabled);
    qs("#layout2")?.toggleAttribute("disabled", disabled);
    qs("#layout1")?.setAttribute("aria-disabled", String(disabled));
    qs("#layout2")?.setAttribute("aria-disabled", String(disabled));
  };

  // NEW: Enable/disable header buttons by class only (matches layout logic)
  const setHeaderButtonsDisabled = (disabled) => {
    qs("#header1")?.classList.toggle("disabled", disabled);
    qs("#header2")?.classList.toggle("disabled", disabled);
    qs("#header1")?.toggleAttribute("disabled", disabled);
    qs("#header2")?.toggleAttribute("disabled", disabled);
    qs("#header1")?.setAttribute("aria-disabled", String(disabled));
    qs("#header2")?.setAttribute("aria-disabled", String(disabled));
  };

  // Apply layout subclass logic
const applyLayout = (val) => {
  // If design=2, layout controls are disabled and layout param should not be set
  if (getCurrentDesign() === "2") return;

  const isTwo = val === "2";
  qsa('[layout="dynamic"]').forEach((el) => {
    if (isTwo) el.classList.add("layout2");
    else el.classList.remove("layout2");
  });

  qs("#layout1")?.classList.toggle("active", !isTwo);
  qs("#layout2")?.classList.toggle("active", isTwo);

  setParam("layout", val);

  // NEW: ensure overflow logic re-applies after layout changes
  if (typeof window.applyOverflow === "function") {
    window.applyOverflow();
  }
};

  // SIMPLE header logic:
  const applyHeader = (val) => {
    const headerOneEl = document.getElementById("headerOne");
    const headerTwoEl = document.getElementById("headerTwo");

    if (val === "1") {
      if (headerOneEl) headerOneEl.style.display = "";
      if (headerTwoEl) headerTwoEl.style.display = "none";
    } else if (val === "2") {
      if (headerOneEl) headerOneEl.style.display = "none";
      if (headerTwoEl) headerTwoEl.style.display = "";
    }

    qs("#header1")?.classList.toggle("active", val === "1");
    qs("#header2")?.classList.toggle("active", val === "2");

    setParam("header", val);
  };

  // Apply cover subclass logic (mirrors layout)
  const applyCover = (val) => {
    // Block when design=2 (same behavior as layout)
    if (getCurrentDesign() === "2") return;

    const targetClass = `cover${val}`;
    const allCoverClasses = ["cover0", "cover1", "cover2"];

    qsa('[cover="dynamic"]').forEach((el) => {
      allCoverClasses.forEach((c) => el.classList.remove(c));
      el.classList.add(targetClass);
    });

    // Button active states
    ["0", "1", "2"].forEach((k) => {
      qs("#cover" + k)?.classList.toggle("active", k === val);
    });
    qs("#noCover")?.classList.remove("active");

    // Persist to URL (cover=0|1|2)
    setParam("cover", val);

    // Ensure cover section is visible when a numbered cover is set
    updateExtras();
  };

  // Toggle between design 1 and design 2, and apply visibility logic
  const applyDesignSwitch = (val) => {
    ["1", "2"].forEach((d) => {
      const show = d === val;
      qsa(`[design="${d}"]`).forEach((el) => {
        el.style.display = show ? "" : "none";
      });
    });

    toggleActive("design1", val === "1");
    toggleActive("design2", val === "2");

    if (val === "2") setParam("cover", "false");

    setParam("design", val);
    updateExtras();

    if (val === "2") {
      setLayoutButtonsDisabled(true);
      params.delete("layout");
      history.replaceState(
        null,
        "",
        `${location.pathname}?${params.toString()}${location.hash}`
      );
      qsa('[layout="dynamic"]').forEach((el) => el.classList.remove("layout2"));
      qs("#layout1")?.classList.remove("active");
      qs("#layout2")?.classList.remove("active");
    } else {
      setLayoutButtonsDisabled(false);
      setParam("layout", "1");
      applyLayout("1");
    }

    // header buttons disabled state follows same logic as layouts
    setHeaderButtonsDisabled(val === "2");

    if (val === "2") {
      setParam("cover", "false");
      qsa('[cover="dynamic"]').forEach((el) =>
        el.classList.remove("cover0", "cover1", "cover2")
      );
      ["0", "1", "2"].forEach((k) =>
        qs("#cover" + k)?.classList.remove("active")
      );
      qs("#noCover")?.classList.add("active");
    }
  };

  // Apply toggle logic for optional elements (cover, company, benefits)
  const updateExtras = () => {
    const design = getCurrentDesign();
    const isDesign2 = design === "2";

    // Disable cover variant buttons when design 2 is active
    ["0", "1", "2"].forEach((k) => {
      qs("#cover" + k)?.classList.toggle("disabled", isDesign2);
      qs("#cover" + k)?.toggleAttribute("disabled", isDesign2);
      qs("#cover" + k)?.setAttribute("aria-disabled", String(isDesign2));
    });
    qs("#noCover")?.classList.toggle("disabled", isDesign2);
    qs("#noCover")?.toggleAttribute("disabled", isDesign2);
    qs("#noCover")?.setAttribute("aria-disabled", String(isDesign2));

    // Company & benefits visibility
    ["benefits", "company"].forEach((key) => {
      const enabled = params.get(key) === "true";
      toggleActive(`${key}Page`, enabled);

      qsa(`[design="${key}"]`).forEach((el) => {
        const match =
          !el.getAttribute("designgroup") ||
          el.getAttribute("designgroup") === design;
        el.style.display = enabled && match ? "" : "none";
      });
    });

    // COVER VISIBILITY
    const coverParam = getCurrentCover(); // "0" | "1" | "2" | "false"
    const showCover = coverParam !== "false" && !isDesign2;

    // Reflect active state on cover buttons
    ["0", "1", "2"].forEach((k) => {
      toggleActive("cover" + k, showCover && coverParam === k);
    });
    toggleActive("noCover", !showCover);

    // Show/hide all cover components
    qsa('[component="cover"]').forEach((el) => {
      const match =
        !el.getAttribute("designgroup") ||
        el.getAttribute("designgroup") === design;
      el.style.display = showCover && match ? "" : "none";
    });
  };

  // Toggle specific section (company or benefits)
  const toggleExtra = (key) => {
    const current = params.get(key) === "true";
    setParam(key, (!current).toString());
    updateExtras();
  };

  // Apply state from URL params
  const applyStateFromParams = () => {
    const design = getCurrentDesign(); // "1" | "2"
    applyDesignSwitch(design);

    const header = getCurrentHeader(); // "1" | "2"
    applyHeader(header);

    if (design !== "2") {
      const layout = getCurrentLayout(); // "1" | "2"
      applyLayout(layout);

      const cover = getCurrentCover(); // "0" | "1" | "2" | "false"
      if (cover !== "false") applyCover(cover);
      else updateExtras();
    } else {
      updateExtras();
    }
  };

  // Set up all button click listeners and initialize design/layout/header view
  const initDesignControls = () => {
    // Design
    safeBind(qs("#design1"), () => applyDesignSwitch("1"));
    safeBind(qs("#design2"), () => applyDesignSwitch("2"));

    // COVER VARIANTS
    safeBind(qs("#cover0"), () => applyCover("0"));
    safeBind(qs("#cover1"), () => applyCover("1"));
    safeBind(qs("#cover2"), () => applyCover("2"));
    safeBind(qs("#noCover"), () => {
      setParam("cover", "false");
      ["0", "1", "2"].forEach((k) =>
        qs("#cover" + k)?.classList.remove("active")
      );
      qs("#noCover")?.classList.add("active");
      qsa('[cover="dynamic"]').forEach((el) => {
        el.classList.remove("cover0", "cover1", "cover2");
      });
      updateExtras();
    });

    // Pages
    safeBind(qs("#benefitsPage"), () => toggleExtra("benefits"));
    safeBind(qs("#companyPage"), () => toggleExtra("company"));

    // Layout buttons (ignored if design=2 due to guard in applyLayout)
    safeBind(qs("#layout1"), () => applyLayout("1"));
    safeBind(qs("#layout2"), () => applyLayout("2"));

    // Header buttons
    safeBind(qs("#header1"), () => applyHeader("1"));
    safeBind(qs("#header2"), () => applyHeader("2"));

    // Defaults only if params are missing (do not overwrite existing URL values)
    if (!params.has("layout")) setParam("layout", "1");
    if (!params.has("header")) setParam("header", "1");
    if (!params.has("cover")) setParam("cover", "0");

    // Apply state now that handlers are ready
    applyStateFromParams();

    // Keep state in sync when user uses back/forward
    window.addEventListener("popstate", applyStateFromParams);
  };

  // DOM Ready
  document.addEventListener("DOMContentLoaded", () => {
    // Zoom controls
    let scale = 0.7;
    const zoomLevelEl = qs("#zoomLevel");
    const updateZoom = () => {
      qsa('[item="page"]').forEach((el) => {
        el.style.zoom = scale;
      });
      if (zoomLevelEl) zoomLevelEl.textContent = `${Math.round(scale * 100)}%`;
    };

    qs("#fullScreen")?.addEventListener("click", () => {
      qs("#editorPanel")?.classList.toggle("hidden");
    });

    qs("#zoomOut")?.addEventListener("click", () => {
      scale = Math.max(0.1, scale - 0.1);
      updateZoom();
    });

    qs("#zoomIn")?.addEventListener("click", () => {
      scale = Math.min(2, scale + 0.1);
      updateZoom();
    });

    updateZoom();

    // Employee selector buttons (ID starts with "Employee")
    const empBtns = qsa('[id^="Employee"]');
    const setActiveButton = (id) => {
      empBtns.forEach((btn) => btn.classList.toggle("active", btn.id === id));
    };

    empBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        params.set("ek", btn.id);
        window.location.href = `${location.pathname}?${params.toString()}${
          location.hash
        }`;
      });
    });

    let ek = params.get("ek");
    if (!ek || !document.getElementById(ek)) {
      ek = "EmployeeA";
      params.set("ek", ek);
      window.location.replace(
        `${location.pathname}?${params.toString()}${location.hash}`
      );
    }
    setActiveButton(ek);

    // Scroll to component when clicking top nav buttons
    const scrollToComponent = (btnId, key) => {
      qs("#" + btnId)?.addEventListener("click", () => {
        const target = qs(`[design="${key}"]`);
        if (target) {
          const offset =
            target.offsetTop - (qs("#pagesWrapper")?.offsetTop || 0);
          qs("#pagesWrapper")?.scrollTo({ top: offset, behavior: "smooth" });
        }
      });
    };

    scrollToComponent("benefitsPage", "benefits");
    scrollToComponent("companyPage", "company");

    // Auto-hide editor panel in preview or shared view
    const hasKey = params.has("key");
    const isPreview = params.has("preview");

    /*
    if (hasKey || isPreview) {
      qs("#editorPanel")?.classList.add("hidden");
      qs("#fullScreen")?.classList.add("hidden");
      qs("#pagesWrapper")?.classList.add("centered");
    }
    */
    
    if (!hasKey && !isPreview) {
      qs("#editButton")?.classList.add("hidden");
    }

    if (!hasKey) {
      qs("#preparedFor")?.classList.add("hidden");
    }
  });

  // Generate preview URL
  const getUrlWithPreviewParam = () => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("preview")) {
      url.searchParams.set("preview", "true");
    }
    return url.toString();
  };

  // Share via email
  qs("#shareEmail")?.addEventListener("click", () => {
    const subject = `Design #${params.get("design")} Preview`;
    const body = `Here is a preview of Compensation Statement Design #${params.get(
      "design"
    )}:\n\n${getUrlWithPreviewParam()}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
  });

  // Copy preview link to clipboard
  qs("#copyButton")?.addEventListener("click", () => {
    const url = getUrlWithPreviewParam();
    navigator.clipboard.writeText(url).then(() => {
      const icon = qs("#copyIcon");
      const alert = qs("#copyAlert");
      if (icon && alert) {
        icon.style.display = "none";
        alert.style.display = "block";
        setTimeout(() => {
          icon.style.display = "flex";
          alert.style.display = "none";
        }, 5000);
      }
    });
  });

  // "Edit" button clears preview params and redirects
  qs("#editButton")?.addEventListener("click", () => {
    params.delete("preview");
    params.delete("key");
    const newUrl = `${location.origin}${location.pathname}?${params}${location.hash}`;
    window.location.href = newUrl;
  });

  // Initial setup
  initDesignControls();
})();
