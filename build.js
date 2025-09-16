//Load Status Initiated
let isLoaded = false;
console.log(isLoaded);

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
            const params = qs();
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

function renderDonutChart({
    chartId,
    categoryGroup,
    containerSelector
}) {
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
        fetchUrl = "https://compstatementdemo.netlify.app/test.json";
    } else {
        fetchUrl = `${baseUrl}?${queryParams}`;
    }

    fetch(fetchUrl)
        .then((response) => response.json())
        .then((data) => {
            document.title = data.companyName;

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

                const signature = document.querySelector('[data="companySignature"]');
                if (!signature) {
                    signature.style.display = "none";
                } else {
                    signature.setAttribute("src", data.companySignature);
                }
            }

            if (!data.employeeFirstName)
                document.querySelectorAll(`[static="welcome"]`).forEach((el) => {
                    el.style.display = "none";
                });

            /*
            function standardTables(data) {
                const categoryEntryTemplate = document.querySelector("#categoryEntry");
                const baseTableTemplate = document.querySelector("#tableTemplate");
                const tableContent = baseTableTemplate.querySelector(
                    ".standardtablewrapper"
                );

                if (!categoryEntryTemplate || !baseTableTemplate || !tableContent) {
                    console.error("No Standard Table Slots Found");
                }

                data.standardTables.forEach((table) => {
                    const container = document.querySelector(`#standard${table.id}`);
                    if (!container) return;

                    // Clear container
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

                        // Subtotal
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

                        // Description
                        const descriptionText = document.createElement("div");
                        descriptionText.classList.add("ptodisclaimer");
                        descriptionText.textContent = "Test";

                        categoryList.appendChild(subtotalClone);
                        //categoryList.appendChild(descriptionText);

                        categoryClone.appendChild(categoryList);

                        categoryListContainer.appendChild(categoryClone);
                    });

                    container.appendChild(tableWrapper);
                });
            }
            */

            // Build the provided "standard table" HTML using the listModule-style builder (el)
// Expects: data.standardTables[] with the same shape you already use
function standardTableWithListMethod(data) {
    console.log("New");
  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => {
      if (k === "class" || k === "className") node.className = v;
      else if (k === "style" && typeof v === "object") {
        Object.assign(node.style, v);
      } else node.setAttribute(k, v);
    });
    (Array.isArray(children) ? children : [children]).forEach((c) => {
      if (c == null) return;
      node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return node;
  };

  const px10 = { fontSize: "10px", lineHeight: "12px" };
  const pad5 = { paddingTop: "5px", paddingBottom: "5px" };

  (data.standardTables || []).forEach((table) => {
    const container = document.querySelector(`#standard${table.id}`);
    if (!container) return;

    // Clear target
    container.innerHTML = "";

    const showCol1 = !!table.column1Name;
    const showCol2 = !!table.column2Name;
    const showCol3 = !!table.column3Name;

    // --- Header ---
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
        style: { backgroundColor: (elementColor && elementColor.tableColor) || "rgb(0, 64, 108)" },
      },
      [tableNameEl, headerLabels]
    );

    const headerWrap = el("div", { class: "standardtablewrap" }, headerInner);
    const wrapper = el("div", { class: "standardtablewrapper" }, headerWrap);

    // --- List container ---
    const listContainer = el("div", { table: "list", class: "standardtablelist" });

    // --- Categories ---
    (table.categories || []).forEach((category) => {
      const categoriesBlock = el("div", { category: "list", class: "standardtablecategories" });

      // Category header
      const catIcon = el("div", {
        category: "icon",
        chartcomp: "color",
        class: "standardtableicon",
        style: { backgroundColor: category.color || (elementColor && elementColor.accentColor) || "rgb(184,146,55)" },
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
            ? el(
                "div",
                { line: "col1", number: "dynamic", class: "standardtablevalue", style: px10 },
                formatCurrency(lineitem.col1_value, null, table.isDecimal)
              )
            : null,
          showCol2
            ? el(
                "div",
                { line: "col2", number: "dynamic", class: "standardtablevalue", style: px10 },
                formatCurrency(lineitem.col2_value, null, table.isDecimal)
              )
            : null,
          showCol3
            ? el(
                "div",
                { line: "col3", number: "dynamic", class: "standardtablevalue", style: px10 },
                formatCurrency(lineitem.col3_value, null, table.isDecimal)
              )
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
              ? el(
                  "div",
                  { subtotal: "col1", number: "dynamic", class: "standardtablesubtotalvalue", style: px10 },
                  formatCurrency(category.col1_subtotal, null, table.isDecimal)
                )
              : null,
            showCol2
              ? el(
                  "div",
                  { subtotal: "col2", number: "dynamic", class: "standardtablesubtotalvalue", style: px10 },
                  formatCurrency(category.col2_subtotal, null, table.isDecimal)
                )
              : null,
            showCol3
              ? el(
                  "div",
                  { subtotal: "col3", number: "dynamic", class: "standardtablesubtotalvalue", style: px10 },
                  formatCurrency(category.col3_subtotal, null, table.isDecimal)
                )
              : null,
          ]),
        ]
      );

      lineWrapper.appendChild(subtotalWrap);
      categoriesBlock.appendChild(lineWrapper);

      // Append category block
      listContainer.appendChild(categoriesBlock);
    });

    // Append list to wrapper and to DOM
    wrapper.appendChild(listContainer);
    container.appendChild(wrapper);
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
                                    index === "0" ?
                                    "zero" :
                                    index === "bool" ?
                                    "bool" :
                                    index === "1" ?
                                    "one" :
                                    index === "2" ?
                                    "two" :
                                    index === "3" ?
                                    "three" :
                                    "";

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
                    const moduleWrapper = document.querySelector(".modulewrapper");
                    if (moduleWrapper) moduleWrapper.remove();
                } else {
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

                    if (moduleData.length === 0) {
                        allModuleContainers.forEach((el) => {
                            el.style.display = "none";
                        });
                    } else if (moduleData.length === 1) {
                        const validId = moduleData[0].id;
                        allModuleContainers.forEach((el) => {
                            if (el.id !== validId) {
                                el.style.display = "none";
                            }
                        });
                    }
                    data.modules.forEach((module) => {
                        const moduleContainer = document.getElementById(module.id);
                        if (!moduleContainer) return;

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
                                labelComponentEl.style.display = component.label?.trim() ?
                                    "" :
                                    "none";
                            }

                            const valueEl =
                                componentClone.querySelector('[category="value"]');
                            if (valueEl) {
                                const isCurrency = component.type === "currency";
                                const needsFormatting = ["currency", "number"].includes(
                                    component.type
                                );

                                const formattedValue = needsFormatting ?
                                    formatCurrency(value, valueEl, module.isDecimal, isCurrency) :
                                    value;

                                valueEl.textContent = formattedValue;
                            }

                            const unitEl = componentClone.querySelector('[category="unit"]');
                            if (unitEl) {
                                unitEl.textContent = component.description || "";
                                unitEl.style.display = component.description?.trim() ?
                                    "" :
                                    "none";
                            }

                            listEl.appendChild(componentClone);
                            hasValidComponent = true;
                        });

                        template.style.display = "none";

                        if (!hasValidComponent) {
                            moduleContainer.style.display = "none";
                        }
                    });
                }
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
                const loader = document.getElementById("loadElement");
                loader.classList.add("loaded");

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

                const coverEl = document.querySelector("#pageCover");
                const showCover = data.coverSheet;

                if (coverEl) {
                    if (showCover === false) {
                        coverEl.style.display = "none";
                    } else {
                        coverEl.style.display = "";
                    }
                }
            }

            function standaloneDisclaimer(disclaimer, id) {
                const container = document.querySelector(`#${id}`);

                const standDisclaimer = document.createElement("div");
                standDisclaimer.className = "benefitdescription";
                standDisclaimer.textContent = disclaimer;

                container.appendChild(standDisclaimer);
            }

            //List Module
            function listModule(data) {
                function buildListModule({
                    label = "Additional Benefits",
                    details = "",
                    values = ["[Bullet Point]"],
                    orientation = "vertical",
                    color = elementColor.tableColor,
                    height = null, // new param
                } = {}) {
                    const el = (tag, attrs = {}, children = []) => {
                        const node = document.createElement(tag);
                        Object.entries(attrs).forEach(([k, v]) => {
                            if (k === "class" || k === "className") node.className = v;
                            else node.setAttribute(k, v);
                        });
                        (Array.isArray(children) ? children : [children]).forEach((c) => {
                            if (c == null) return;
                            node.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
                        });
                        return node;
                    };

                    const heading = el(
                        "div", {
                            data: "label",
                            class: "listmoduleheading"
                        },
                        label
                    );
                    const header = el(
                        "div", {
                            module: "header",
                            class: "listmoduleheader"
                        },
                        heading
                    );
                    header.style.backgroundColor = color;

                    const detailsEl = el("div", {
                        data: "details",
                        class: "listdescription",
                    });
                    if (details) {
                        detailsEl.textContent = details;
                    } else {
                        detailsEl.style.display = "none";
                    }

                    const ul = el("ul", {
                        data: "values",
                        role: "list",
                        class: "listitemline",
                    });
                    values.forEach((val) => {
                        const li = el("li", {
                            data: "value",
                            class: "listitemtext"
                        });
                        li.innerHTML = val;
                        ul.appendChild(li);
                    });

                    const listItems = el(
                        "div", {
                            module: "listItems",
                            class: "listitemitems w-richtext"
                        },
                        ul
                    );
                    const listWrapper = el(
                        "div", {
                            module: "list",
                            class: `listmodulelist ${orientation}`
                        },
                        [detailsEl, listItems]
                    );

                    const template = el(
                        "div", {
                            module: "template",
                            class: "listmoduletemplate"
                        },
                        [header, listWrapper]
                    );

                    // apply height if defined
                    if (height && !isNaN(height)) {
                        template.style.minHeight = `${height}px`;
                    }

                    return template;
                }

                (data.listModule || []).forEach((item) => {
                    const target = document.getElementById(String(item.id));
                    if (!target) {
                        console.warn(`listModule: No element found with id="${item.id}"`);
                        return;
                    }

                    const moduleEl = buildListModule({
                        label: item.label,
                        details: item.details,
                        values: item.values,
                        orientation: "vertical",
                        color: elementColor.tableColor,
                        height: item.height, // pass height from JSON
                    });

                    target.appendChild(moduleEl);
                });
            }


            staticData(data, statementElement);
            //standardTables(data);
            booleanTables(data);
            modules(data);
            donutCharts(data);
            benefitsList(data);
            holidaysList(data);
            contactsLists(data.companyContacts, '[contacts="company"]');
            contactsLists(data.benefitContacts, '[contacts="providers"]');
            //standaloneDisclaimer(data.booleantable3_disclaimer, "booleantable3");
            loadDisplay(data);
            listModule(data);
            standardTableWithListMethod(data);

            const spans = document.querySelectorAll("span");
            spans.forEach((span) => {
                span.style.color = elementColor.primaryColor;
                span.style.fontWeight = "bold";
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
