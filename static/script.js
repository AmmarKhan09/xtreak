window.addEventListener("pageshow", function (e) {
  if (e.persisted) {
    window.location.reload();
  }
});

function refreshAtMidnight() {
  var now = new Date();
  var midnight = new Date();
  midnight.setHours(24, 0, 0, 0);

  var timeToMidnight = midnight.getTime() - now.getTime();
  setTimeout(function() {
    window.location.reload();
  }, timeToMidnight);
}

refreshAtMidnight();

const xMarkSound = new Audio("/static/soft-pop.mp3");
const dingSound = new Audio("/static/ding.mp3");
xMarkSound.preload = "auto";
xMarkSound.volume = 0.2;
dingSound.preload = "auto";
dingSound.volume = 0.7;

document.addEventListener("DOMContentLoaded", () => {
  if (document.body.dataset.page === "index") {

    // Making list draggable
    const sortable = new Sortable(document.getElementById("task-list"), {
      animation: 150,
      disabled: true,

      handle: ".drag-handle",

      delay: 200,
      delayOnTouchOnly: true,

      onEnd: () => {
        saveTaskOrder();
      }
    });
    
    const container = document.querySelector("#task-list");
    const menuDropdown = document.getElementById("dropdown");
    const sortDropdown = document.getElementById("sortDropdown");
    const sortBtn = document.getElementById("sortBtn");
    const handle = document.querySelectorAll(".drag-handle");

    let currentSort = sortDropdown.dataset.sort;
    sortable.option("disabled", currentSort !== "custom");
    handle.forEach(el => el.style.display = currentSort === "custom" ? "flex" : "none");

    if (sortBtn && sortDropdown) {
      sortBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        sortDropdown.style.display = sortDropdown.style.display === "block" ? "none" : "block";
      });

      sortDropdown.addEventListener("click", (e) => {
        e.stopPropagation();
      });

      document.addEventListener("click", () => {
        sortDropdown.style.display = "none";
      });
    }

    if (container && container.querySelector(".task-item")) {
      if (sortDropdown) {
        sortDropdown.querySelectorAll("button").forEach(b => {
          if (b.dataset.sort === currentSort) {
            b.classList.add("selected");
          }

          b.addEventListener("click", () => {
            const type = b.dataset.sort;
            currentSort = type;

            sortTasks(type);
            saveSortPreference(type);
            sortDropdown.dataset.sort = type;

            if (sortable) {
              sortable.option("disabled", type !== "custom");
            }

            handle.forEach(el => el.style.display = type === "custom" ? "flex" : "none");

            sortDropdown.querySelectorAll(".selected").forEach(el => {
              el.classList.remove("selected");
            });
            b.classList.add("selected");

            setTimeout(() => {
              sortDropdown.style.display = "none";
            }, 100);
          });
        });
      }
    }

    function sortTasks(type) {
      const container = document.querySelector("#task-list");
      const items = Array.from(document.querySelectorAll(".task-item"));
      items.sort((a, b) => {
        const nameA = a.dataset.name;
        const nameB = b.dataset.name;
        const dateA = new Date(a.dataset.date);
        const dateB = new Date(b.dataset.date);
        const customA = Number(a.dataset.position);
        const customB = Number(b.dataset.position);

        if (type === "date_desc") return dateB - dateA;
        if (type === "date_asc") return dateA - dateB;
        if (type === "name_asc") return nameA.localeCompare(nameB);
        if (type === "name_desc") return nameB.localeCompare(nameA);
        if (type === "custom") return customA - customB;
      });
      items.forEach(el => container.appendChild(el));
    }

    function saveSortPreference(type) {
      fetch("/set-sort", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort: type })
      });
    }    
  }

  function saveTaskOrder() {
    const items = document.querySelectorAll(".task-item");

    const order = Array.from(items).map((el, index) => {
      const position = index + 1;

      el.dataset.position = position;

      return {
        id: el.dataset.id,
        position: position
      };
    });

    fetch("/update-task-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(order)
    });
  }
});

// Handle AJAX form submissions
async function ajaxForm(form, url, successRedirect) {

  if (!form) return;

  form.addEventListener("submit", async (e) => {

    e.preventDefault();

    const data = new FormData(form);

    const res = await fetch(url, {
      method: "POST",
      body: data
    });

    const result = await res.json();

    if (result.error) {
      const error = form.querySelector(".error");
      showMessage(error, result.error, "error");
    } else if (result.success && successRedirect) {
      window.location = successRedirect;
    } else if (result.success && !successRedirect) {
      const success = form.querySelector(".success");
      showMessage(success, result.message, "success");
    }
  });
};

// Initialize AJAX forms
ajaxForm(
  document.querySelector("#register_form"),
  "/register",
  "/"
);

ajaxForm(
  document.querySelector("#login_form"),
  "/login",
  "/"
);

ajaxForm(
  document.querySelector("#edit_form"),
  "/profile",
  "/profile"
);

ajaxForm(
  document.querySelector("#add_task"),
  "/add-task",
  "/"
);

const form = document.querySelector("#update_description");
const tmp_task_id = form ? form.dataset.id : null;

if (tmp_task_id) {
  ajaxForm(
    form,
    `/update_description/${tmp_task_id}`
  );  
}

function showMessage(el, msg, type = "success") {
  if (!el) return;

  el.textContent = msg;
  el.className = `error ${type}`; // optional styling

  clearTimeout(el._timeout);

  el._timeout = setTimeout(() => {
    el.textContent = "";
  }, 3000); // 3 sec
}


// Event listener for password visibility toggle
document.addEventListener("click", function(e){

  const toggle = e.target.closest(".password_toggle");
  if (!toggle) return;

  const input = document.getElementById(toggle.dataset.target);

  const open = toggle.querySelector(".eye-open");
  const closed = toggle.querySelector(".eye-closed");

  if (input.type === "password") {
    input.type = "text";
    open.style.display = "block";
    closed.style.display = "none";
  } else {
    input.type = "password";
    open.style.display = "none";
    closed.style.display = "block";
  }
});

// Handle dropdown menu
const btn = document.getElementById("menuBtn");
const dropdown = document.getElementById("dropdown");

if (btn && dropdown) {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.style.display =
      dropdown.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target) && !btn.contains(e.target)) {
      dropdown.style.display = "none";
  }});

  window.addEventListener("scroll", () => {
    dropdown.style.display = "none";
  });  
}


// Event listener to switch between edit and view mode on profile page
const editBtn = document.getElementById("editBtn");
const cancelBtn = document.getElementById("cancelBtn");
const editActions = document.querySelector(".edit-actions");
const editBtnWrapper = document.querySelector(".edit-button");
const editableFields = document.querySelectorAll(".my-form-2");
const profilePasswordWrappers = document.querySelectorAll(".profile-password-wrapper")
const profileForm = document.getElementById("edit_form");
if (profileForm) {
  const profileInputs = profileForm.querySelectorAll("input");
  const originalValues = {};

    // Store original values when the page loads
  profileInputs.forEach(input => {
    originalValues[input.name] = input.value;
  });

  editBtn.addEventListener("click", () => {
    editableFields.forEach(field => field.removeAttribute("readonly"));
    editActions.style.display = "flex";
    editBtnWrapper.style.display = "none";
    profilePasswordWrappers.forEach(wrapper => wrapper.style.display = "block")
  });

  cancelBtn.addEventListener("click", () => {
    editableFields.forEach(field => field.setAttribute("readonly", true));
    editActions.style.display = "none";
    editBtnWrapper.style.display = "flex";
    profilePasswordWrappers.forEach(wrapper => wrapper.style.display = "none")
    profileInputs.forEach(input => {
      input.value = originalValues[input.name];
    });
  });
}

/* Calendar */

document.addEventListener('DOMContentLoaded', function () {
  const calendarEl = document.getElementById('calendar');

  if (!calendarEl) return;

  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    showNonCurrentDates: false,
    fixedWeekCount: false,
    firstDay: 1,
    editable: false,
    selectable: false,
    headerToolbar: {
      left: 'prev',
      center: 'title',
      right: 'next'
    },
    datesSet: function(info) {
      currentStart = info.startStr;
      currentEnd = info.endStr;

      requestAnimationFrame(() => {
        requestAnimationFrame(reapplyMarks);
      });
    },
    dateClick: function(info) {
      if (!isInCurrentView(info.dateStr)) return;
      if (isFuture(info.dateStr)) return;

      xMarkSound.currentTime = 0;
      xMarkSound.play();

      setTimeout(() => {
        toggleDate(info.dateStr, info.dayEl);        
      }, 50);
    }
  });

  calendar.render();

  if (markedDates.size) {
    setTimeout(() => {
      reapplyMarks();
      updateUIStreaks();
      updateFireIcon();
      updateTrophyIcon();
    }, 0);
  }

  loadDates();
  loadStreaks();

  const el = calendarEl.querySelector('.fc-view-harness');

  let startX = 0, startY = 0;

  el.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  });

  el.addEventListener('touchend', (e) => {
    let endX = e.changedTouches[0].clientX;
    let endY = e.changedTouches[0].clientY;

    let diffX = startX - endX;
    let diffY = startY - endY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX > 0) animate('next');
      else animate('prev');
    }
  });

  function animate(direction) {
    const view = calendarEl.querySelector('.fc-view-harness');

    view.style.transition = 'transform 0.15s ease, opacity 0.15s ease';
    view.style.transform = `translateX(${direction === 'next' ? '-15px' : '15px'})`;
    view.style.opacity = 0;

    setTimeout(() => {
      if (direction === 'next') calendar.next();
      else calendar.prev();

      view.style.transform = 'translateX(0)';
      view.style.opacity = 1;
    }, 150);
  }
});

/* Main calendar funcion */

let firstLoadFire = true;
let firstLoadTrophy = true;

function updateFireIcon() {
  if (!document.getElementById('calendar')) return;
  
  const today = new Date().toISOString().split('T')[0];
  const fire = document.querySelector('.bi-fire');
  if (!fire) return;

  const { current } = calculateStreaks();

  const wasLit = fire.classList.contains('lit');
  const wasToday = fire.classList.contains('today');

  if (current > 0) {
    fire.classList.add('lit');
  } else {
    fire.classList.remove('lit');
    fire.classList.remove('today');
  }

  if (markedDates.has(today)) {
    fire.classList.add('today');
  } else {
    fire.classList.remove('today');
  }

  if (firstLoadFire) {
    firstLoadFire = false;
    return;
  }

  if (
    (!wasLit && fire.classList.contains('lit')) ||
    (!wasToday && fire.classList.contains('today'))
  ) {
    animateFire(fire);
  }
}

function animateFire(fire) {
  fire.classList.remove('pop');
  void fire.offsetWidth;
  fire.classList.add('pop');
}

let recordBrokenThisStreak = false;

function updateTrophyIcon(oldLongest) {
  if (!document.getElementById('calendar')) return;
  
  const trophy = document.querySelector('.bi-trophy-fill');
  if (!trophy) return;

  const { current, longest } = calculateStreaks();

  wasLit = trophy.classList.contains('lit');

  if (longest > 0) {
    trophy.classList.add('lit');
  } else {
    trophy.classList.remove('lit');
  }

  if (firstLoadTrophy) {
    firstLoadTrophy = false;
    return;
  }

  if (current === 0) {
    recordBrokenThisStreak = false;
    return;
  }

  if (!wasLit && trophy.classList.contains('lit')) {
    animateTrophy(trophy);
  }

  if (
    current === longest && current > oldLongest &&
    !recordBrokenThisStreak &&
    current > 1
  ) {
    dingSound.currentTime = 0;
    dingSound.play();
    animateTrophy(trophy);

    recordBrokenThisStreak = true;
  }
}

function animateTrophy(trophy) {
  trophy.classList.remove('pop');
  void trophy.offsetWidth;
  trophy.classList.add('pop');
}

function isInCurrentView(date) {
  const el = document.querySelector(
    `.fc-daygrid-day[data-date="${date}"]`
  );

  if (!el) return false;

  if (el.classList.contains('fc-day-other')) return false;

  return true;
}

let task_id = null;

const calendarEl = document.getElementById('calendar');

if (calendarEl) {
  task_id = calendarEl.dataset.taskId;

  if (!task_id) {
    console.error("task_id missing");
  }
}

let markedDates = new Set(window.initialMarkedDates || []);

function toggleDate(date, el) {
  let oldLongest = calculateStreaks().longest;
  if (markedDates.has(date)) {
    // remove
    markedDates.delete(date);
    removeX(el);
    removeFromDB(date);
  } else {
    // add
    markedDates.add(date);
    addX(el);
    saveToDB(date);
  }
  updateUIStreaks();
  updateFireIcon();
  updateTrophyIcon(oldLongest);
}

function addX(el, skipAnimation = false) {
  const numberEl = el.querySelector('.fc-daygrid-day-number');
  if (!numberEl) return;
  if (!el || !el.isConnected) return;

  if (numberEl.querySelector('.x-mark')) return;

  numberEl.insertAdjacentHTML('beforeend', `
    <svg class="x-mark ${skipAnimation ? 'no-anim' : ''}" viewBox="0 0 24 24">
      <path d="M5 5 L19 19 M19 5 L5 19"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"/>
    </svg>
  `);
}

function removeX(el) {
  const x = el.querySelector('.x-mark');
  if (!x) return;

  x.style.transition = 'opacity 0.15s ease';
  x.style.opacity = '0';

  setTimeout(() => x.remove(), 150);
}

function saveToDB(date) {
  if (!task_id) return;

  fetch('/add-date', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, task_id })
  });
}

function removeFromDB(date) {
  if (!task_id) return;
  fetch('/remove-date', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ date, task_id })
  });
}

function loadDates() {
  if (!task_id) return;

  fetch(`/get-dates?task_id=${task_id}`)
    .then(res => res.json())
    .then(data => {
      data.forEach(date => markedDates.add(date));

      setTimeout(reapplyMarks, 0);
      updateUIStreaks();
      updateFireIcon();
      updateTrophyIcon();
    }); 
}

function reapplyMarks() {
  const calendarEl = document.getElementById('calendar');
  if (!calendarEl) return;

  const cells = calendarEl.querySelectorAll('.fc-daygrid-day');

  if (!cells.length) return;

  // remove safely
  calendarEl.querySelectorAll('.x-mark').forEach(x => {
    if (x && x.isConnected) x.remove();
  });

  markedDates.forEach(date => {
    if (!isInCurrentView(date)) return;

    const el = getValidCell(date);
    if (el) addX(el, true);
  });
}

function loadStreaks() {
  if (!task_id) return;
  fetch(`/get-streaks?task_id=${task_id}`)
    .then(res => res.json())
    .then(data => {
      document.getElementById('current').innerText = data.current;
      document.getElementById('longest').innerText = data.longest;
      updateUIStreaks()
    }
  ); 
}

function getValidCell(date) {
  const calendarEl = document.getElementById('calendar');

  const cell = calendarEl.querySelector(
    `.fc-daygrid-day[data-date="${date}"]:not(.fc-day-other)`
  );

  if (!cell) return null;

  const frame = cell.querySelector('.fc-daygrid-day-frame');
  return frame || cell;
}

function isFuture(dateStr) {
  const todayStr = new Date().toISOString().split('T')[0];
  return dateStr > todayStr;
}

function calculateStreaks() {
  const dates = Array.from(markedDates).sort();

  if (dates.length === 0) return { current: 0, longest: 0 };

  // ---------- LONGEST (unchanged) ----------
  const dateObjs = dates.map(d => {
    let x = new Date(d);
    x.setHours(0,0,0,0);
    return x;
  });

  let longest = 1;
  let temp = 1;

  for (let i = 1; i < dateObjs.length; i++) {
    let prev = new Date(dateObjs[i - 1]);
    prev.setDate(prev.getDate() + 1);

    if (dateObjs[i].getTime() === prev.getTime()) {
      temp++;
    } else {
      longest = Math.max(longest, temp);
      temp = 1;
    }
  }

  longest = Math.max(longest, temp);

  // ---------- CURRENT (FIXED) ----------
  const todayStr = new Date().toISOString().split('T')[0];

  let current = 0;
  let check = null;

  if (markedDates.has(todayStr)) {
    current = 1;
    check = todayStr;
  } else {
    let d = new Date(todayStr);
    d.setDate(d.getDate() - 1);
    let yesterdayStr = d.toISOString().split('T')[0];

    if (markedDates.has(yesterdayStr)) {
      current = 1;
      check = yesterdayStr;
    } else {
      return { current: 0, longest };
    }
  }

  // walk backwards
  while (true) {
    let d = new Date(check);
    d.setDate(d.getDate() - 1);
    let prev = d.toISOString().split('T')[0];

    if (markedDates.has(prev)) {
      current++;
      check = prev;
    } else break;
  }

  return { current, longest };
}

function updateUIStreaks() {
  const { current, longest } = calculateStreaks();

  animateNumber(document.getElementById('current'), current);
  animateNumber(document.getElementById('longest'), longest);
}

function animateNumber(el, newValue) {
  const start = parseInt(el.innerText) || 0;
  const duration = 150;

  let startTime = null;

  function step(timestamp) {
    if (!startTime) startTime = timestamp;
    const progress = timestamp - startTime;

    const value = Math.floor(
      start + (newValue - start) * (progress / duration)
    );

    el.innerText = value;

    if (progress < duration) {
      requestAnimationFrame(step);
    } else {
      el.innerText = newValue;
    }
  }

  requestAnimationFrame(step);
}

/* Task title edit */
function editTitle() {
    const title = document.getElementById("task-title");
    const input = document.getElementById("title-input");
    const error = document.getElementById("title-error");

    error.innerText = "";
    input.value = title.innerText;

    title.style.display = "none";
    input.style.display = "block";
    input.focus();
}

function handleEnter(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        saveTitle();
        e.target.blur();
    }
}

function saveTitle() {
    const title = document.getElementById("task-title");
    const input = document.getElementById("title-input");
    const error = document.getElementById("title-error");

    if (input.style.display === "none") return;

    let newTitle = input.value;
    let originalTitle = title.innerText;
    let taskId = title.dataset.id;

    clearTimeout(window.errorTimeout);

    if (!newTitle || !newTitle.trim()) {
        error.innerText = "Task title can't be empty";

        input.value = originalTitle;
        title.style.display = "block";
        input.style.display = "none";

        window.errorTimeout = setTimeout(() => {
            error.innerText = "";
        }, 3000);

        return;
    }

    fetch("/update_task_name/" + taskId, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTitle })
    })
    .then(res => res.json().then(data => ({ status: res.status, body: data })))
    .then(res => {
        if (res.status !== 200) {
            error.innerText = res.body.error || "Error";

            input.value = originalTitle;
            title.style.display = "block";
            input.style.display = "none";

            window.errorTimeout = setTimeout(() => {
                error.innerText = "";
            }, 3000);

            return;
        }

        title.innerText = res.body.name;
        error.innerText = "";

        title.style.display = "block";
        input.style.display = "none";
    })
    .catch(() => {
        error.innerText = "Something went wrong";

        window.errorTimeout = setTimeout(() => {
            error.innerText = "";
        }, 3000);
    });
}

if (calendarEl) {
  const textarea = document.getElementById("taskDescription2");

  if (textarea) {
    function autoResize(el) {
      el.style.height = "auto";
      el.style.height = Math.max(el.scrollHeight, 80) + "px";
    }

    // initial load
    autoResize(textarea);

    // typing pe
    textarea.addEventListener("input", () => autoResize(textarea));
  }

  function formatDateTime(str) {
    const d = new Date(str);

    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  }

  const timeEl = document.getElementById('task-created');
  const raw = timeEl.dataset.time;
  const formatted = formatDateTime(raw);

  timeEl.textContent = `Task created on ${formatted}`;
}

// Input submission changes

if (document.body.dataset.page === "login") {
  const username = document.querySelector("#login_username");
  const password = document.querySelector(".login-password");
  const form = document.querySelector("#login_form");

  if (username && password && form) {
    username.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        password.focus();

        const len = password.value.length;
        password.setSelectionRange(len, len);
      }
    });

    password.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        form.requestSubmit();
      }
    });
  }
}

if (document.body.dataset.page === "register") {
  const name = document.querySelector("#register_name");
  const username = document.querySelector("#register_username");
  const password = document.querySelector(".register-password");
  const form = document.querySelector("#register_form");

  if (username && password && form) {
    name.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        username.focus();

        const len = username.value.length;
        username.setSelectionRange(len, len);
      }
    });

    username.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        password.focus();

        const len = password.value.length;
        password.setSelectionRange(len, len);
      }
    });

    password.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        form.requestSubmit();
      }
    });
  }
} 

if (document.body.dataset.page === "profile") {
  const name = document.querySelector("#edit_name");
  const username = document.querySelector("#edit_username");
  const currentPassword = document.querySelector("#current_password");
  const newPassword = document.querySelector("#new_password");
  const form = document.querySelector("#edit_form");

  if (name && username && currentPassword && newPassword && form) {
    name.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        username.focus();

        const len = username.value.length;
        username.setSelectionRange(len, len);
      }
    });

    username.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        currentPassword.focus();

        const len = currentPassword.value.length;
        currentPassword.setSelectionRange(len, len);
      }
    });

    currentPassword.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        newPassword.focus();

        const len = newPassword.value.length;
        newPassword.setSelectionRange(len, len);
      }
    });

    newPassword.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        form.requestSubmit();
      }
    });
  }
}