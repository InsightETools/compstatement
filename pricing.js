document.addEventListener("DOMContentLoaded", function () {
  var slider = document.getElementById("slider");

  noUiSlider.create(slider, {
    step: 0.1,
    range: {
      min: 0,
      max: 10,
    },
    start: [1],
    connect: [true, false],
    padding: [1, 0],
    pips: { mode: "count", values: 10, density: 10 },
  });

  var pips = slider.querySelectorAll(".noUi-value");

  for (let i = 0; i < pips.length; i++) {
    let val = Number(pips[i].getAttribute("data-value"));

    if (i === pips.length - 1) {
      continue;
    }

    pips[i].innerHTML = (val + 1) + "k";
  }

  pips[pips.length - 1].innerHTML = "10+";

  function clickOnPip() {
    var value = Number(this.getAttribute("data-value"));
    slider.noUiSlider.set(value);
  }

  for (var i = 0; i < pips.length; i++) {
    pips[i].style.paddingTop = "5px";
    pips[i].style.cursor = "pointer";
    pips[i].addEventListener("click", clickOnPip);
  }

  slider.noUiSlider.on("update", function (values, handle) {
    const directValue = values[handle] * 97;
    const providerValue = values[handle] * (97 - 97 * 0.4);
    const savingsValue = directValue - providerValue;

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

  const providerList = ["ADP", "Fire & Vine", "Paylocity", "Pivot Sales", "Workday"];
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
});
