//Load Status Initiated
let isLoaded = false;
console.log(isLoaded);
//document.title = "Statement Demo";

//Demo
document.addEventListener("DOMContentLoaded", () => {
  const qs = () => new URLSearchParams(window.location.search);
  const nav = (pathname, params) => {
    const hash = window.location.hash; // preserve #…
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
      const params = new URLSearchParams(window.location.search);
      params.set("ek", idNum);
      nav(window.location.pathname, params);
    });
  });

  const pathMatch = window.location.pathname.match(/design-(\d+)$/);
  if (pathMatch) {
    const activeDesign = document.getElementById(`design-${pathMatch[1]}`);
    if (activeDesign)
      designBtns.forEach((b) =>
        b.classList.toggle("active", b === activeDesign)
      );
  }
  const ek = qs().get("ek");
  if (ek) {
    const activeEmp = document.getElementById(`employee-${ek}`);
    if (activeEmp)
      empBtns.forEach((b) => b.classList.toggle("active", b === activeEmp));
  }

  const demoEl = document.getElementById("demo");
  if (demoEl) demoEl.style.display = qs().get("demo") === "true" ? "" : "none";
});

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

function renderDonutChart({ chartId, categoryGroup, containerSelector }) {
  const chartContainer = document.querySelector(`#${chartId}`);
  const legendContainer = document.querySelector(containerSelector);

  if (!Array.isArray(categoryGroup)) return;

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

  chartContainer.style.background = `conic-gradient(${gradientParts.join(
    ", "
  )})`;
}

function applyElementColors(clone, colorMap) {
  if (!clone) return;
  clone.querySelectorAll("[element]").forEach((el) => {
    const elementType = el.getAttribute("element");
    const colorAttr = el.getAttribute("color");
    const cssColor = colorMap?.[colorAttr];
    if (!cssColor) return;

    if (elementType === "text") {
      el.style.color = cssColor;
    } else if (elementType === "block") {
      el.style.backgroundColor = cssColor;
    } else if (elementType === "stroke") {
      el.style.borderColor = elementType;
    }
  });
}

//Execute Tasks
document.addEventListener("DOMContentLoaded", () => {
  // === Get query parameters from current URL ===
  const urlParams = new URLSearchParams(window.location.search);
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
    "https://etools.secure-solutions.biz/totalcompadmin/design/ClientParamsFlat1.aspx";
  queryParams = new URLSearchParams({
    usecors: "1",
    key,
    cpid,
    yr,
    ck,
    ek,
  }).toString();

  if (test) {
    fetchUrl = "https://ywrfgg.csb.app/test.json";
    /*"https://gist.githubusercontent.com/InsightETools/f3c13974a9926d97576b461b474e8c40/raw/e4f211d180eba048a41dc9290fd06ec895810f0a/templateDraft.json";*/
  } else {
    fetchUrl = `${baseUrl}?${queryParams}`;
  }

  fetch(fetchUrl)
    .then((response) => response.json())
    .then((data) => {
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
          //el.style.height = data.companyLogoHeight + "px";
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
              labelValue === null ||
              labelValue === undefined ||
              String(labelValue).trim() === "";

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
                const index = match[1].toLowerCase();
                const columnAttr =
                  index === "0"
                    ? "zero"
                    : index === "bool"
                    ? "bool"
                    : index === "1"
                    ? "one"
                    : index === "2"
                    ? "two"
                    : index === "3"
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
          const weekdayWrapperEl = wrapperClone.querySelector(
            ".holidayweekdaywrapper"
          );
          const dateEl = wrapperClone.querySelector(".holidaydate");
          const nameEl = wrapperClone.querySelector(".holidayname");

          if (weekdayEl) weekdayEl.textContent = holiday.weekday || "";
          if (dateEl) dateEl.textContent = holiday.date || "";
          if (nameEl) nameEl.textContent = holiday.name || "";
          //if (weekdayWrapperEl) weekdayWrapperEl.style.borderColor = "#ffffff";

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

        // 🔧 FIX: Declare local params + getCurrentDesign
        const params = new URLSearchParams(window.location.search);
        const getCurrentDesign = () => params.get("design") || "1";

        const coverEl = document.querySelector("#pageCover");
        const showCover =
          params.get("cover") === "true" && getCurrentDesign() !== "2";

        if (coverEl) {
          coverEl.style.display = showCover ? "" : "none";
        }

        setTimeout(() => {
          const loader = document.getElementById("loader");
          if (loader) {
            loader.classList.add("finished");
            //loader.style.display = "none";
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

      staticData(data, statementElement);
      standardTables(data);
      booleanTables(data);
      modules(data);
      donutCharts(data);
      benefitsList(data);
      holidaysList(data);
      contactsLists(data.companyContacts, '[contacts="company"]');
      contactsLists(data.benefitContacts, '[contacts="providers"]');
      //standaloneDisclaimer(data.booleantable3_disclaimer, "booleantable3");
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
      primaryColors.forEach((primaryColors) => {
        primaryColors.style.color = elementColor.primaryColor;
      });

      const secondaryColors = document.querySelectorAll(
        '[color="secondaryColor"]'
      );
      secondaryColors.forEach((secondaryColors) => {
        secondaryColors.style.color = elementColor.secondaryColor;
      });

      //Check Overflow
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
              childRect.bottom > pageRect.bottom ||
              childRect.right > pageRect.right
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

      //Load Status Finished
      isLoaded = true;
      console.log(isLoaded);
    })
    .catch((error) => {
      const errorCheck = error.message.includes("Unexpected token");
      alert(errorCheck ? "No User Found" : error);
    });
});

(() => {
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => document.querySelectorAll(sel);
  const params = new URLSearchParams(window.location.search);

  const setParam = (key, value) => {
    params.set(key, value);
    history.replaceState(null, "", `${location.pathname}?${params.toString()}`);
  };

  const toggleActive = (id, isActive) => {
    const el = qs("#" + id);
    if (el) el.classList.toggle("active", isActive);
  };

  const getCurrentDesign = () => params.get("design") || "1";

  const applyDesignSwitch = (val) => {
    ["1", "2"].forEach((d) => {
      const show = d === val;
      qsa(`[design="${d}"]`).forEach((el) => {
        el.style.display = show ? "" : "none";
      });
    });

    toggleActive("design1", val === "1");
    toggleActive("design2", val === "2");

    if (val === "2") {
      setParam("cover", "false");
    }

    setParam("design", val);
    updateExtras();
  };

  const updateExtras = () => {
    const currentDesign = getCurrentDesign();
    const isDesign2 = currentDesign === "2";

    const coverTrueBtn = qs("#coverTrue");
    const coverFalseBtn = qs("#coverFalse");

    if (coverTrueBtn) {
      coverTrueBtn.classList.toggle("disabled", isDesign2);
    }
    if (coverFalseBtn) {
      coverFalseBtn.classList.toggle("disabled", isDesign2);
    }

    ["benefits", "company"].forEach((key) => {
      const isEnabled = params.get(key) === "true";
      toggleActive(`${key}Page`, isEnabled);

      qsa(`[design="${key}"]`).forEach((el) => {
        const designAttr = el.getAttribute("designgroup");
        const matchesDesign = !designAttr || designAttr === currentDesign;
        el.style.display = isEnabled && matchesDesign ? "" : "none";
      });
    });

    const showCover = params.get("cover") === "true" && !isDesign2;
    toggleActive("coverTrue", showCover);
    toggleActive("coverFalse", !showCover);

    qsa('[component="cover"]').forEach((el) => {
      const designAttr = el.getAttribute("designgroup");
      const matchesDesign = !designAttr || designAttr === currentDesign;
      el.style.display = showCover && matchesDesign ? "" : "none";
    });
  };

  const toggleExtra = (key) => {
    const current = params.get(key) === "true";
    setParam(key, (!current).toString());
    updateExtras();
  };

  const applyCoverToggle = (val) => {
    const currentDesign = getCurrentDesign();

    if (currentDesign === "2" && val === "true") {
      return;
    }

    setParam("cover", val);
    updateExtras();
  };

  qs("#design1")?.addEventListener("click", () => applyDesignSwitch("1"));
  qs("#design2")?.addEventListener("click", () => applyDesignSwitch("2"));

  qs("#coverTrue")?.addEventListener("click", () => applyCoverToggle("true"));
  qs("#coverFalse")?.addEventListener("click", () => applyCoverToggle("false"));

  qs("#benefitsPage")?.addEventListener("click", () => toggleExtra("benefits"));
  qs("#companyPage")?.addEventListener("click", () => toggleExtra("company"));

  const currentDesign = getCurrentDesign();

  if (currentDesign === "2" && params.get("cover") !== "false") {
    setParam("cover", "false");
  }

  applyDesignSwitch(currentDesign);

  if (currentDesign === "2" && params.get("cover") !== "false") {
    setParam("cover", "false");
  }
  applyDesignSwitch(currentDesign);
})();

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const designParam = params.get("design");

  if (designParam) {
    const designNumberEl = document.getElementById("designNumber");
    if (designNumberEl) {
      designNumberEl.textContent = `Design #${designParam}`;
    }
  }
});

//Window Buttons
document.addEventListener("DOMContentLoaded", () => {
  const editorPanel = document.getElementById("editorPanel");
  const fullScreenBtn = document.getElementById("fullScreen");
  const zoomOutBtn = document.getElementById("zoomOut");
  const zoomInBtn = document.getElementById("zoomIn");
  const pagesWrapper = document.getElementById("pagesWrapper");
  const zoomLevelEl = document.getElementById("zoomLevel");

  let scale = 1; // initial zoom level

  const updateScale = () => {
    document.querySelectorAll('[item="page"]').forEach((el) => {
      el.style.zoom = scale;
    });
    if (zoomLevelEl) {
      zoomLevelEl.textContent = `${Math.round(scale * 100)}%`;
    }
  };

  if (fullScreenBtn) {
    fullScreenBtn.addEventListener("click", () => {
      editorPanel?.classList.toggle("hidden");
      //pagesWrapper?.classList.toggle("centered");
    });
  }

  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      scale = Math.max(0.1, scale - 0.1);
      updateScale();
    });
  }

  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      scale = Math.min(2, scale + 0.1);
      updateScale();
    });
  }

  // Initialize on load
  updateScale();
});

const pagesWrapper = document.getElementById("pagesWrapper");

const updateScale = () => {
  document.querySelectorAll('[item="page"]').forEach((el) => {
    el.style.transform = `scale(${scale})`;
    el.style.transformOrigin = "top left";

    const baseSpacing = 24;
    el.style.marginBottom = `${baseSpacing * scale}px`;
  });
};

document.addEventListener("DOMContentLoaded", () => {
  const empBtns = document.querySelectorAll('[id^="000"]');

  const setActiveButton = (empId) => {
    empBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.id === empId);
    });
  };

  empBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const empId = btn.id;
      const params = new URLSearchParams(window.location.search);
      params.set("ek", empId);

      const newUrl = `${window.location.pathname}?${params.toString()}${
        window.location.hash
      }`;
      window.location.href = newUrl; // ⬅️ triggers full page reload
    });
  });

  const params = new URLSearchParams(window.location.search);
  let ek = params.get("ek");

  if (!ek || !document.getElementById(ek)) {
    ek = "000000"; // default
    params.set("ek", ek);
    const newUrl = `${window.location.pathname}?${params.toString()}${
      window.location.hash
    }`;
    window.location.replace(newUrl); // ⬅️ replaces URL and reloads
  }

  setActiveButton(ek);
});

document.addEventListener("DOMContentLoaded", () => {
  const pagesWrapper = document.getElementById("pagesWrapper");

  const scrollToComponent = (buttonId, componentName) => {
    const button = document.getElementById(buttonId);
    if (!button || !pagesWrapper) return;

    button.addEventListener("click", () => {
      const target = document.querySelector(`[design="${componentName}"]`);
      if (!target) {
        console.warn(`No component found with component="${componentName}"`);
        return;
      }

      const targetOffset = target.offsetTop - pagesWrapper.offsetTop;
      pagesWrapper.scrollTo({
        top: targetOffset,
        behavior: "smooth",
      });
    });
  };

  scrollToComponent("benefitsPage", "benefits");
  scrollToComponent("companyPage", "company");
});

document.addEventListener("DOMContentLoaded", () => {
  const params = new URLSearchParams(window.location.search);
  const hasKey = params.has("key");
  const isPreview = params.has("preview");

  if (hasKey || isPreview) {
    const editorPanel = document.getElementById("editorPanel");
    const fullScreen = document.getElementById("fullScreen");
    const pagesWrapper = document.getElementById("pagesWrapper");

    editorPanel?.classList.add("hidden");
    fullScreen?.classList.add("hidden");
    pagesWrapper?.classList.add("centered");
  }

  if (!hasKey && !isPreview) {
    const editButton = document.getElementById("editButton");
    editButton?.classList.add("hidden");
  }

  if (!hasKey) {
    const preparedFor = document.getElementById("preparedFor");
    preparedFor?.classList.add("hidden");
    document.title = `Design #${designParam} Preview`;
  }
});

function getUrlWithPreviewParam() {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("preview")) {
    url.searchParams.set("preview", "true");
  }
  return url.toString();
}

document.getElementById("shareEmail").addEventListener("click", function () {
  const params = new URLSearchParams(window.location.search);
  const designParam = params.get("design");
  const subject = `Design #${designParam} Preview`;
  const body = `Here is a preview of Compensation Statement Design #${designParam}:\n\n${getUrlWithPreviewParam()}`;

  const mailtoLink = `mailto:?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
  window.location.href = mailtoLink;
});

document.getElementById("copyButton").addEventListener("click", function () {
  const updatedUrl = getUrlWithPreviewParam();

  navigator.clipboard
    .writeText(updatedUrl)
    .then(() => {
      const copyIcon = document.getElementById("copyIcon");
      const copyAlert = document.getElementById("copyAlert");

      copyIcon.style.display = "none";
      copyAlert.style.display = "block";

      // After 5 seconds, switch back
      setTimeout(() => {
        copyIcon.style.display = "flex";
        copyAlert.style.display = "none";
      }, 5000);
    })
    .catch((err) => {
      console.error("Failed to copy URL: ", err);
    });
});

document.getElementById("editButton").addEventListener("click", function () {
  const params = new URLSearchParams(window.location.search);

  // Remove specific parameters
  params.delete("preview");
  params.delete("key");

  // Reconstruct the URL
  const baseUrl = window.location.origin + window.location.pathname;
  const hash = window.location.hash; // preserve any hash (e.g., #section1)
  const newUrl = params.toString()
    ? `${baseUrl}?${params.toString()}${hash}`
    : `${baseUrl}${hash}`;

  // Navigate to the new URL
  window.location.href = newUrl;
});
