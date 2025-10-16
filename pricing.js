document.addEventListener("DOMContentLoaded", function () {
  var slider = document.getElementById("slider");

  noUiSlider.create(slider, {
    step: 1,
    range: {
      min: 50,
      max: 2000,
    },
    start: [1],
    connect: [true, false],
    padding: [1, 0],
    pips: { mode: "count", values: 10, density: 10 },
  });

  var pips = slider.querySelectorAll(".noUi-value");

  function clickOnPip() {
    var value = Number(this.getAttribute("data-value"));
    slider.noUiSlider.set(value);
  }

  for (var i = 0; i < pips.length; i++) {
    pips[i].style.paddingTop = "5px";
    pips[i].style.cursor = "pointer";
    pips[i].addEventListener("click", clickOnPip);
  }

  pips[pips.length - 1].innerHTML = "21+";

  const directTotal = document.getElementById("directTotal");
  const providerTotal = document.getElementById("providerTotal");
  const providerSavings = document.getElementById("providerSavings");

  slider.noUiSlider.on("update", function (values, handle) {
    const directValue = values[handle] * 97;
    const providerValue = values[handle] * (97 - 97 * 0.4);
    const savingsValue = directValue - providerValue;

    directTotal.textContent = directValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    providerTotal.textContent = providerValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    providerSavings.textContent = savingsValue.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const currentValue = Number(values[handle]);

    const userElements = document.querySelectorAll(".uservalue");
    const customElements = document.querySelectorAll(".customvalue");
    const signupButton = document.querySelectorAll(".signupbutton");

    if (currentValue === 21) {
      userElements.forEach((el) => (el.style.display = "none"));
      customElements.forEach((el) => (el.style.display = "block"));
      signupButton.forEach((el) => (el.textContent = "Contact Us"));
    } else {
      userElements.forEach((el) => (el.style.display = "block"));
      customElements.forEach((el) => (el.style.display = "none"));
      signupButton.forEach((el) => (el.textContent = "Signup Now"));
    }
  });

  const selectContainer = document.getElementById("select-container");
  const searchInput = document.getElementById("search-input");
  const dropdown = document.getElementById("dropdown");
  const signup = document.getElementById("signup");
  const container = document.getElementById("providerList");

  const providerList = [
    "ADP",
    "Fire & Vine",
    "Paylocity",
    "Pivot Sales",
    "Workday",
  ];
  const customOption = "Can't Find Your Provider? Let's Talk!";

  function updateSignupState() {
    const inputValue = searchInput.value.trim().toLowerCase();
    const isValid =
      providerList.some((p) => p.toLowerCase() === inputValue) ||
      inputValue === customOption.toLowerCase();

    if (isValid) {
      signup.classList.remove("null");
    } else {
      signup.classList.add("null");
    }
  }

  function handleOptionClick(value) {
    searchInput.value = value;
    searchInput.classList.add("closed");
    dropdown.style.display = "none";
    updateSignupState();
    searchInput.blur();
  }

  function buildDropdown() {
    const existingProviders = container.querySelectorAll('[search="provider"]');
    existingProviders.forEach((el) => el.remove());

    providerList.forEach(function (provider) {
      const item = document.createElement("div");
      item.setAttribute("search", "provider");
      item.setAttribute("select", "provider");
      item.textContent = provider;
      item.classList.add("providerselect");

      item.addEventListener("mousedown", function (e) {
        e.preventDefault();
        handleOptionClick(provider);
      });

      container.appendChild(item);
    });
  }

  function attachStaticSelectableHandlers() {
    const staticItems = dropdown.querySelectorAll(
      '[select="provider"]:not([search])'
    );
    staticItems.forEach((item) => {
      item.addEventListener("mousedown", function (e) {
        e.preventDefault();
        handleOptionClick(item.textContent.trim());
      });
    });
  }

  // Initial setup
  buildDropdown();
  attachStaticSelectableHandlers();

  searchInput.addEventListener("focus", function () {
    dropdown.style.display = "flex";
    searchInput.classList.remove("closed");
  });

  searchInput.addEventListener("input", function () {
    dropdown.style.display = "flex";
    searchInput.classList.remove("closed");
    updateSignupState();

    const filter = searchInput.value.toLowerCase();
    const allOptions = dropdown.querySelectorAll("[search]");

    allOptions.forEach((option) => {
      const isSearchable = option.getAttribute("search") === "provider";
      const text = option.textContent.toLowerCase();

      if (isSearchable) {
        option.style.display = text.includes(filter) ? "flex" : "none";
      } else {
        option.style.display = "flex";
      }
    });
  });

  searchInput.addEventListener("blur", function () {
    setTimeout(function () {
      searchInput.classList.add("closed");
      dropdown.style.display = "none";
    }, 100);
  });

  document.addEventListener("click", function (event) {
    if (!selectContainer.contains(event.target)) {
      dropdown.style.display = "none";
    }
  });
});
