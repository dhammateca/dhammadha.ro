(function () {
  var root = document.querySelector("[data-uposatha-calendar]");
  var dataNode = document.getElementById("uposatha-calendar-data");

  if (!root || !dataNode) {
    return;
  }

  var rawEvents;
  try {
    rawEvents = JSON.parse(dataNode.textContent);
  } catch (error) {
    return;
  }

  if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
    return;
  }

  var titleNode = root.querySelector("[data-calendar-title]");
  var monthViewNode = root.querySelector("[data-calendar-month-view]");
  var listViewNode = root.querySelector("[data-calendar-list-view]");
  var nextNode = root.querySelector("[data-uposatha-next]");
  var prevButton = root.querySelector("[data-calendar-previous]");
  var nextButton = root.querySelector("[data-calendar-next]");
  var todayButton = root.querySelector("[data-calendar-today]");

  var monthFormatter = new Intl.DateTimeFormat("ro-RO", {
    month: "long",
    year: "numeric"
  });
  var dayFormatter = new Intl.DateTimeFormat("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  var shortDayFormatter = new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short"
  });

  var weekdayLabels = ["Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata", "Duminica"];
  var phaseSymbols = {
    "new": "●",
    "waxing": "◐",
    "full": "○",
    "waning": "◑"
  };

  function parseDateParts(dateString) {
    var parts = dateString.split("-");
    return {
      year: Number(parts[0]),
      month: Number(parts[1]),
      day: Number(parts[2])
    };
  }

  function createLocalDate(dateString) {
    var parts = parseDateParts(dateString);
    return new Date(parts.year, parts.month - 1, parts.day);
  }

  function toKey(date) {
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function buildSummary(event) {
    if (event.note) {
      return event.note;
    }

    if (event.phase && event.season && event.days) {
      return event.day_text + " · ziua " + event.days + " · " + event.season + " " + event.season_number + "/" + event.season_total;
    }

    return event.day_text || "";
  }

  function aggregateEvents(events) {
    var grouped = {};

    events.forEach(function (event) {
      if (!grouped[event.date]) {
        grouped[event.date] = {
          date: event.date,
          dateObject: createLocalDate(event.date),
          primary: null,
          notes: []
        };
      }

      var bucket = grouped[event.date];
      if (event.phase && !bucket.primary) {
        bucket.primary = event;
      }

      if (event.note) {
        bucket.notes.push(event.note);
      }
    });

    return Object.keys(grouped).sort().map(function (key) {
      var item = grouped[key];
      var primary = item.primary;
      var isUposatha = Boolean(primary && (primary.phase === "new" || primary.phase === "full"));

      return {
        date: item.date,
        dateObject: item.dateObject,
        primary: primary,
        notes: item.notes,
        isUposatha: isUposatha,
        phase: primary ? primary.phase : "",
        phaseText: primary ? primary.day_text : (item.notes[0] || ""),
        summary: primary ? buildSummary(primary) : (item.notes[0] || "")
      };
    });
  }

  var events = aggregateEvents(rawEvents);
  var today = new Date();
  var todayKey = toKey(today);
  var initialEvent = events.find(function (event) {
    return event.date >= todayKey;
  }) || events[0];
  var viewDate = new Date(initialEvent.dateObject.getFullYear(), initialEvent.dateObject.getMonth(), 1);

  function renderNextUposatha() {
    var nextUposatha = events.find(function (event) {
      return event.isUposatha && event.date >= todayKey;
    }) || events.find(function (event) {
      return event.isUposatha;
    });

    if (!nextUposatha || !nextNode) {
      return;
    }

    var details = [capitalize(dayFormatter.format(nextUposatha.dateObject)), nextUposatha.summary];
    if (nextUposatha.notes.length > 0) {
      details.push(nextUposatha.notes.join(" · "));
    }
    nextNode.textContent = details.join(" — ");
  }

  function getMonthEvents(year, monthIndex) {
    return events.filter(function (event) {
      return event.dateObject.getFullYear() === year && event.dateObject.getMonth() === monthIndex;
    });
  }

  function renderMonthView(year, monthIndex) {
    var firstDay = new Date(year, monthIndex, 1);
    var daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    var startOffset = (firstDay.getDay() + 6) % 7;
    var cells = [];

    for (var i = 0; i < startOffset; i += 1) {
      cells.push('<div class="uposatha-month__cell uposatha-month__cell--empty" aria-hidden="true"></div>');
    }

    for (var day = 1; day <= daysInMonth; day += 1) {
      var current = new Date(year, monthIndex, day);
      var key = toKey(current);
      var event = events.find(function (entry) {
        return entry.date === key;
      });
      var classes = ["uposatha-month__cell"];

      if (event) {
        classes.push("has-event");
      }
      if (event && event.isUposatha) {
        classes.push("is-uposatha");
      }
      if (key === todayKey) {
        classes.push("is-today");
      }

      var meta = "";
      var notes = "";
      if (event) {
        meta = '<p class="uposatha-month__phase">' + (phaseSymbols[event.phase] || "•") + " " + event.phaseText + "</p>";
        if (event.primary && event.primary.season) {
          meta += '<p class="uposatha-month__detail">Ziua ' + event.primary.days + " · " + event.primary.season + " " + event.primary.season_number + "/" + event.primary.season_total + "</p>";
        }
        if (event.notes.length > 0) {
          notes = '<p class="uposatha-month__notes">' + event.notes.join(" · ") + "</p>";
        }
      }

      cells.push(
        '<article class="' + classes.join(" ") + '">' +
          '<p class="uposatha-month__date">' + day + "</p>" +
          meta +
          notes +
        "</article>"
      );
    }

    monthViewNode.innerHTML =
      '<div class="uposatha-month__weekdays">' +
      weekdayLabels.map(function (label) {
        return '<div class="uposatha-month__weekday">' + label + "</div>";
      }).join("") +
      "</div>" +
      '<div class="uposatha-month__grid">' + cells.join("") + "</div>";
  }

  function renderListView(year, monthIndex) {
    var monthEvents = getMonthEvents(year, monthIndex);

    if (monthEvents.length === 0) {
      listViewNode.innerHTML = '<p class="uposatha-list__empty">Nu exista evenimente in luna aceasta.</p>';
      return;
    }

    listViewNode.innerHTML = monthEvents.map(function (event) {
      var notes = event.notes.length > 0
        ? '<p class="uposatha-list__notes">' + event.notes.join(" · ") + "</p>"
        : "";

      return (
        '<article class="uposatha-list__item' + (event.isUposatha ? " is-uposatha" : "") + '">' +
          '<p class="uposatha-list__date">' + capitalize(dayFormatter.format(event.dateObject)) + "</p>" +
          '<h3 class="uposatha-list__phase">' + (phaseSymbols[event.phase] || "•") + " " + event.phaseText + "</h3>" +
          '<p class="uposatha-list__summary">' + event.summary + "</p>" +
          notes +
        "</article>"
      );
    }).join("");
  }

  function render() {
    if (titleNode) {
      titleNode.textContent = capitalize(monthFormatter.format(viewDate));
    }

    renderMonthView(viewDate.getFullYear(), viewDate.getMonth());
    renderListView(viewDate.getFullYear(), viewDate.getMonth());
  }

  if (prevButton) {
    prevButton.addEventListener("click", function () {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
      render();
    });
  }

  if (nextButton) {
    nextButton.addEventListener("click", function () {
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
      render();
    });
  }

  if (todayButton) {
    todayButton.addEventListener("click", function () {
      viewDate = new Date(today.getFullYear(), today.getMonth(), 1);
      render();
    });
  }

  renderNextUposatha();
  render();
}());
