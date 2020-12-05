// ==UserScript==
// @name          TWRepetitiveUpcomingAttacks
// @version       0.2
// @author        szelbi
// @website       https://szelbi.ovh/
// @match         *://*/*
// @grant         none
// @updateURL     https://github.com/sz3lbi/TWRepetitiveUpcomingAttacks/raw/main/TWRepetitiveUpcomingAttacks.user.js
// @downloadURL   https://github.com/sz3lbi/TWRepetitiveUpcomingAttacks/raw/main/TWRepetitiveUpcomingAttacks.user.js
// ==/UserScript==

(function () {
  "use strict";

  const url = window.location.href;

  let villagesArray = [];
  let tableRowDataArray = [];

  let locale = "en";

  const localizedStrings = {
    en: {
      noUpcomingAttacks: "No upcoming attacks.",
      getListButton: "Get list of attacks repetitions",
      addColumnButton: "Add column with attacks amount",
      amountHeader: "Attacks amount",
      editNamesButton: "Add attacks amount to names",
      confirmNameChange: "Change next attack name",
      stopNameChange: "Stop renaming",
    },
    pl: {
      noUpcomingAttacks: "Brak nadchodzących ataków.",
      getListButton: "Pobierz listę powtórzeń ataków",
      addColumnButton: "Dodaj kolumnę z liczbą ataków",
      amountHeader: "Liczba ataków",
      editNamesButton: "Dodaj liczbę ataków do nazw",
      confirmNameChange: "Zmień nazwę kolejnego ataku",
      stopNameChange: "Zatrzymaj zmianę nazw",
    },
  };

  function setBestLocaleByBrowser() {
    const bestLang = navigator.languages.find((r) =>
      Object.keys(localizedStrings).includes(r)
    );
    if (bestLang) {
      locale = bestLang;
    }
  }

  function i18n(name) {
    return localizedStrings[locale][name];
  }

  class Village {
    constructor(coords, attacksIncoming) {
      this._coords = coords;
      this._attacksIncoming = attacksIncoming;
    }

    get coords() {
      return this._coords;
    }

    set coords(coords) {
      this._coords = coords;
    }

    get attacksIncoming() {
      return this._attacksIncoming;
    }

    set attacksIncoming(attacksIncoming) {
      this._attacksIncoming = attacksIncoming;
    }
  }

  function emptyArray(array) {
    array.length = 0;
  }

  function createResultTextarea() {
    const textarea = document.createElement("textarea");
    textarea.style.display = "block";
    textarea.style.marginLeft = "auto";
    textarea.style.marginRight = "auto";
    textarea.style.width = "95%";
    textarea.rows = "15";

    let text = "";
    for (const village of villagesArray) {
      text += `${village.coords} - ${village.attacksIncoming}\n`;
    }

    if (!text) {
      text = i18n("noUpcomingAttacks");
    }
    textarea.value = text.trim();

    return textarea;
  }

  function createResultContainer() {
    const resultContainer = document.createElement("div");
    resultContainer.style.overflow = "auto";
    resultContainer.style.margin = "0px 0px 5px 0px";
    resultContainer.classList.add("vis", "vis_item");
    resultContainer.append(createResultTextarea());
    document.getElementById("contentContainer").prepend(resultContainer);
  }

  function disableButton(button) {
    button.classList.add("btn-disabled");
    button.disabled = true;
  }

  function enableButton(button) {
    button.classList.remove("btn-disabled");
    button.disabled = false;
  }

  function insertAfter(newNode, referenceNode) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  function findVillageByCoords(coords) {
    return villagesArray.find((e) => e.coords === coords);
  }

  function getVillageCoordsFromName(name) {
    return name.match(/(?:\()(\d{3}\|\d{3})(?:\)\s\K\d{2})$/)[1];
  }

  function getIncomingsTableRows() {
    return document.querySelectorAll("#incomings_table > tbody > tr");
  }

  function getIncomingsData() {
    emptyArray(villagesArray);
    fillTableRowDataArray();

    for (const data of tableRowDataArray) {
      const coords = getVillageCoordsFromName(data[2].innerText);
      const village = findVillageByCoords(coords);
      if (village) {
        village.attacksIncoming++;
      } else {
        villagesArray.push(new Village(coords, 1));
      }
    }
  }

  function addCSS(css) {
    const style = document.createElement("style");
    style.innerHTML = css;
    document.head.appendChild(style);
  }

  function closeConfirmModal() {
    document.getElementById("szelbiRepetitiveUpcomingsModal").style.display =
      "none";
  }

  function confirmButtonOnClick() {
    const data = tableRowDataArray[0];
    tableRowDataArray.shift();

    const renameIcon = data[0].querySelector(
      "span[class='quickedit'] > span > a[class='rename-icon']"
    );
    if (renameIcon) {
      const coords = getVillageCoordsFromName(data[2].innerText);
      renameIcon.click();

      const input = data[0].querySelector("input[type='text']");
      if (input) {
        input.value = `${getNameWithoutAmount(input.value)} (${
          findVillageByCoords(coords).attacksIncoming
        })`;

        const changeNameButton = data[0].querySelector(
          "input[type='button'][class='btn']"
        );
        if (changeNameButton) {
          changeNameButton.click();
        }
      }
    }

    if (!tableRowDataArray.length) {
      closeConfirmModal();
      enableButton(
        document.getElementById("szelbiRepetitiveUpcomingsEditNamesButton")
      );
      addMainButtonsListeners();
    }
  }

  function showConfirmModal() {
    document.getElementById("szelbiRepetitiveUpcomingsModal").style.display =
      "block";
  }

  function stopRenamingButtonOnClick() {
    closeConfirmModal();
    emptyArray(tableRowDataArray);
    enableButton(
      document.getElementById("szelbiRepetitiveUpcomingsEditNamesButton")
    );
    addMainButtonsListeners();
  }

  function createConfirmModal() {
    const modalCSS = `
    .modal {
      display: none;
      position: fixed;
      z-index: 12000;
      padding-top: 100px;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgb(0,0,0);
      background-color: rgba(0,0,0,0.4);
    }
    .modalContent {
      background-color: #ead5aa;
      margin: auto;
      padding: 20px;
      border: 1px solid #7d510f;
      width: 40%;
    }
  `;
    addCSS(modalCSS);

    const modalDiv = document.createElement("div");
    modalDiv.style.overflow = "auto";
    modalDiv.setAttribute("id", "szelbiRepetitiveUpcomingsModal");
    modalDiv.setAttribute("class", "modal");
    modalDiv.innerHTML = `
      <p class="modalContent center">
        <button type="button" class="btn btn-default" id="szelbiRepetitiveUpcomingsConfirmButton">${i18n(
          "confirmNameChange"
        )}</button>
        <button type="button" class="btn btn-default" id="szelbiRepetitiveUpcomingsStopRenamingButton">${i18n(
          "stopNameChange"
        )}</button>
      </p>
    `;
    document.getElementById("contentContainer").prepend(modalDiv);

    document
      .getElementById("szelbiRepetitiveUpcomingsConfirmButton")
      .addEventListener("click", confirmButtonOnClick);

    document
      .getElementById("szelbiRepetitiveUpcomingsStopRenamingButton")
      .addEventListener("click", stopRenamingButtonOnClick);
  }

  function getNameWithoutAmount(name) {
    return name.match(/^(.+?)(?:\s+\(\d+\))?$/)[1];
  }

  function fillTableRowDataArray() {
    emptyArray(tableRowDataArray);

    const tableRows = getIncomingsTableRows();
    if (tableRows.length) {
      for (let i = 1; i < tableRows.length - 1; i++) {
        const data = tableRows[i].querySelectorAll("td");
        tableRowDataArray.push(data);
      }
    }
  }

  function editNamesButtonOnClick() {
    disableButton(this);
    getIncomingsData();

    if (tableRowDataArray.length) {
      removeMainButtonsListeners();

      createConfirmModal();
      showConfirmModal();
    }
  }

  function getListButtonOnClick() {
    disableButton(this);
    getIncomingsData();

    createResultContainer();
  }

  function addColumnButtonOnClick() {
    disableButton(this);
    getIncomingsData();

    const tableRows = getIncomingsTableRows();

    if (tableRows.length) {
      for (let i = 0; i < tableRows.length - 1; i++) {
        const data = tableRows[i].querySelectorAll("th, td");

        if (data.length) {
          const previousElement = data[2];

          if (previousElement.tagName == "TD") {
            const column = document.createElement("td");
            const coords = getVillageCoordsFromName(previousElement.innerText);

            const village = findVillageByCoords(coords);
            if (village) {
              column.innerText = village.attacksIncoming;
            }

            insertAfter(column, previousElement);
          } else if (previousElement.tagName == "TH") {
            const header = document.createElement("th");
            header.innerText = i18n("amountHeader");
            insertAfter(header, previousElement);
          }
        }
      }
      const lastRowHeaders = tableRows[tableRows.length - 1].querySelectorAll(
        "th"
      );
      lastRowHeaders[lastRowHeaders.length - 1].colSpan += 1;
    }
  }
  
  function addMainButtonsListeners() {
    document.getElementById("szelbiRepetitiveUpcomingsGetListButton").addEventListener("click", getListButtonOnClick);
    document.getElementById("szelbiRepetitiveUpcomingsAddColumnButton").addEventListener("click", addColumnButtonOnClick);
    document.getElementById("szelbiRepetitiveUpcomingsEditNamesButton").addEventListener("click", editNamesButtonOnClick);
  }
  
  function removeMainButtonsListeners() {
    document.getElementById("szelbiRepetitiveUpcomingsGetListButton").removeEventListener("click", getListButtonOnClick);
    document.getElementById("szelbiRepetitiveUpcomingsAddColumnButton").removeEventListener("click", addColumnButtonOnClick);
    document.getElementById("szelbiRepetitiveUpcomingsEditNamesButton").removeEventListener("click", editNamesButtonOnClick);
  }

  function init() {
    setBestLocaleByBrowser();

    const getListButton = document.createElement("button");
    getListButton.setAttribute("type", "button");
    getListButton.setAttribute("class", "btn btn-default float_right");
    getListButton.setAttribute("id", "szelbiRepetitiveUpcomingsGetListButton");
    getListButton.innerHTML = i18n("getListButton");

    const addColumnButton = document.createElement("button");
    addColumnButton.setAttribute("type", "button");
    addColumnButton.setAttribute("class", "btn btn-default float_right");
    addColumnButton.setAttribute(
      "id",
      "szelbiRepetitiveUpcomingsAddColumnButton"
    );    
    addColumnButton.innerHTML = i18n("addColumnButton");

    const editNamesButton = document.createElement("button");
    editNamesButton.setAttribute("type", "button");
    editNamesButton.setAttribute("class", "btn btn-default float_right");
    editNamesButton.setAttribute(
      "id",
      "szelbiRepetitiveUpcomingsEditNamesButton"
    );
    editNamesButton.innerHTML = i18n("editNamesButton");    

    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.overflow = "auto";
    buttonsContainer.style.marginTop = "5px";
    buttonsContainer.style.marginBottom = "5px";
    buttonsContainer.append(getListButton);
    buttonsContainer.append(addColumnButton);
    buttonsContainer.append(editNamesButton);

    const filtersManageUrl = document.querySelector(
      "a[class='overview_filters_manage']"
    );

    insertAfter(buttonsContainer, filtersManageUrl);

    addMainButtonsListeners();
  }

  if (url.includes("game.php") && url.includes("subtype=attacks")) {
    init();
  }
})();
