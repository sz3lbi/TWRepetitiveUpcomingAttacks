// ==UserScript==
// @name          TWRepetitiveUpcomingAttacks
// @version       0.1
// @author        szelbi
// @website       https://szelbi.ovh/
// @match         */game.php*
// @grant         none
// @updateURL     https://github.com/sz3lbi/TWRepetitiveUpcomingAttacks/raw/main/TWRepetitiveUpcomingAttacks.user.js
// @downloadURL   https://github.com/sz3lbi/TWRepetitiveUpcomingAttacks/raw/main/TWRepetitiveUpcomingAttacks.user.js
// ==/UserScript==

(function () {
  "use strict";

  const url = window.location.href;
  let villages = [];

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

  function createResultTextarea() {
    const textarea = document.createElement("textarea");
    textarea.style.display = "block";
    textarea.style.marginLeft = "auto";
    textarea.style.marginRight = "auto";
    textarea.style.width = "95%";
    textarea.rows = "15";

    let text = "";
    for (const village of villages) {
      text += `${village.coords} - ${village.attacksIncoming}\n`;
    }

    if (!text) {
      text = "No upcoming attacks.";
    }
    textarea.value = text.trim();

    return textarea;
  }

  function createResultContainer() {
    const resultContainer = document.createElement("div");
    resultContainer.style.margin = "0px 0px 5px 0px";
    resultContainer.classList.add("vis", "vis_item");
    resultContainer.append(createResultTextarea());
    document.getElementById("contentContainer").prepend(resultContainer);
  }

  function disableButton(button) {
    button.classList.add("btn-disabled");
    button.disabled = true;
  }

  function buttonOnClick() {
    disableButton(this);

    const tableRows = document.querySelectorAll(
      "#incomings_table > tbody > tr"
    );

    if (tableRows.length) {
      for (const row of tableRows) {
        const data = row.querySelectorAll("td");
        if (data.length) {
          const result = data[2].innerText.match(
            /(?:\()(\d{3}\|\d{3})(?:\)\s\K\d{2})$/
          );
          const coords = result[1];
          const filteredVillages = villages.filter((e) => e.coords === coords);
          if (filteredVillages.length > 0) {
            filteredVillages[0].attacksIncoming++;
          } else {
            villages.push(new Village(coords, 1));
          }
        }
      }
    }
    createResultContainer();
  }

  function init() {
    const getButton = document.createElement("button");
    getButton.setAttribute("type", "button");
    getButton.setAttribute("class", "btn btn-default float_right");
    getButton.addEventListener("click", buttonOnClick);
    getButton.innerHTML = "Get repetitive upcoming attacks";

    const filtersManageUrl = document.querySelector(
      "a[class='overview_filters_manage']"
    );
    filtersManageUrl.parentNode.insertBefore(
      getButton,
      filtersManageUrl.nextSibling
    );
  }

  if (url.includes("mode=incomings") && url.includes("subtype=attacks")) {
    init();
  }
})();
