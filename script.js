// ---------- Helper functions for saving and loading ----------

// Get all saved reports (returns an empty list if none exist yet)
function getReports() {
  try {
    const data = localStorage.getItem("reports");
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Saved reports could not be read:", error);
    return [];
  }
}

// Save the full list of reports
function saveReports(reports) {
  localStorage.setItem("reports", JSON.stringify(reports));
}

// Create a unique ID like CIR-0001, CIR-0002, ...
function generateReportId() {
  let counter = Number(localStorage.getItem("idCounter")) || 0;
  counter = counter + 1;
  localStorage.setItem("idCounter", counter);
  return "CIR-" + String(counter).padStart(4, "0");
}
// ---------- Show reports in the table ----------

function renderReports() {
  renderDashboard(); 
  const allReports = getReports();
  const tbody = document.getElementById("reports-body");
  const emptyMessage = document.getElementById("empty-message");
  const resultCount = document.getElementById("result-count");

  const searchText = document.getElementById("search-input").value.trim().toLowerCase();
  const categoryFilter = document.getElementById("filter-category").value;
  const statusFilter = document.getElementById("filter-status").value;

  const reports = allReports.filter(function (report) {
    const searchableText = (
      report.id + " " + report.title + " " + report.location + " " + report.description
    ).toLowerCase();

    const matchesSearch = searchText === "" || searchableText.includes(searchText);
    const matchesCategory = categoryFilter === "" || report.category === categoryFilter;
    const matchesStatus = statusFilter === "" || report.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  tbody.innerHTML = "";
  resultCount.textContent = "Showing " + reports.length + " of " + allReports.length + " reports";

  if (reports.length === 0) {
    emptyMessage.textContent = allReports.length === 0
      ? "No reports yet. Submit one above!"
      : "No reports match your search or filters.";
    emptyMessage.style.display = "block";
    return;
  }
  emptyMessage.style.display = "none";

  reports.slice().reverse().forEach(function (report) {
    const row = document.createElement("tr");
    const statusClass = report.status.replace(/ /g, "-");

    row.innerHTML =
      "<td>" + report.id + "</td>" +
      "<td>" + escapeHtml(report.title) + "</td>" +
      "<td>" + report.category + "</td>" +
      "<td>" + escapeHtml(report.location) + "</td>" +
      '<td><span class="badge priority-' + report.priority + '">' + report.priority + "</span></td>" +
      '<td><span class="badge status-' + statusClass + '">' + report.status + "</span></td>" +
      "<td>" + report.date + "</td>" +
      "<td>" + buildStatusDropdown(report) + "</td>" +
      '<td class="action-cell">' +
        '<button type="button" class="action-btn btn-view" data-action="view" data-id="' + report.id + '">View</button>' +
        '<button type="button" class="action-btn btn-delete" data-action="delete" data-id="' + report.id + '">Delete</button>' +
      "</td>";

    tbody.appendChild(row);
  });
}
// ---------- Dashboard ----------

// Draws one set of bars (for example, one bar per category)
function renderBars(containerId, reports, field, options) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  options.forEach(function (option) {
    const count = reports.filter(function (r) { return r[field] === option.value; }).length;
    const percent = reports.length === 0 ? 0 : Math.round((count / reports.length) * 100);

    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML =
      '<span class="bar-label">' + option.label + "</span>" +
      '<div class="bar-track"><div class="bar-fill" style="width:' + percent + "%; background-color:" + option.color + '"></div></div>' +
      '<span class="bar-count">' + count + "</span>";

    container.appendChild(row);
  });
}

// Fills the four summary cards and both bar charts
function renderDashboard() {
  const reports = getReports();

  function countStatus(status) {
    return reports.filter(function (r) { return r.status === status; }).length;
  }

  document.getElementById("stat-total").textContent = reports.length;
  document.getElementById("stat-open").textContent = countStatus("Open");
  document.getElementById("stat-progress").textContent = countStatus("In Progress");
  document.getElementById("stat-resolved").textContent = countStatus("Resolved");

  renderBars("category-breakdown", reports, "category", [
    { value: "Streetlight",  label: "Streetlight",  color: "#1e5aa8" },
    { value: "Water Leak",   label: "Water Leak",   color: "#1e5aa8" },
    { value: "Garbage",      label: "Overflowing Bin", color: "#1e5aa8" },
    { value: "Road Damage",  label: "Road Damage",  color: "#1e5aa8" },
    { value: "Other",        label: "Other",        color: "#1e5aa8" }
  ]);

  renderBars("priority-breakdown", reports, "priority", [
    { value: "High",   label: "High",   color: "#d9534f" },
    { value: "Medium", label: "Medium", color: "#f0ad4e" },
    { value: "Low",    label: "Low",    color: "#5cb85c" }
  ]);
}
// ---------- Status dropdown and updating ----------

// Builds the <select> for one report, with its current status pre-selected
function buildStatusDropdown(report) {
  const statuses = ["Open", "In Progress", "Resolved"];
  let html = '<select class="status-select" data-id="' + report.id + '">';

  statuses.forEach(function (status) {
    const selected = status === report.status ? " selected" : "";
    html += '<option value="' + status + '"' + selected + ">" + status + "</option>";
  });

  html += "</select>";
  return html;
}

// Finds the report by ID, changes its status, saves, and redraws the table
function updateStatus(reportId, newStatus) {
  const reports = getReports();

  reports.forEach(function (report) {
    if (report.id === reportId) {
      report.status = newStatus;
    }
  });

  saveReports(reports);
  renderReports();
}
// ---------- View details and delete ----------

function openReportModal(reportId) {
  const report = getReports().find(function (r) { return r.id === reportId; });
  if (!report) return;

  document.getElementById("modal-title").textContent = report.id + " - " + report.title;

  document.getElementById("modal-body").innerHTML =
    '<div class="modal-row"><strong>Category:</strong> ' + report.category + "</div>" +
    '<div class="modal-row"><strong>Location:</strong> ' + escapeHtml(report.location) + "</div>" +
    '<div class="modal-row"><strong>Priority:</strong> ' + report.priority + "</div>" +
    '<div class="modal-row"><strong>Status:</strong> ' + report.status + "</div>" +
    '<div class="modal-row"><strong>Submitted:</strong> ' + report.date + "</div>" +
    '<div class="modal-row"><strong>Description:</strong>' +
    '<div class="modal-description">' + escapeHtml(report.description) + "</div></div>";

  document.getElementById("modal-overlay").classList.add("open");
}

function closeReportModal() {
  document.getElementById("modal-overlay").classList.remove("open");
}

function deleteReport(reportId) {
  const sure = confirm("Delete report " + reportId + "? This cannot be undone.");
  if (!sure) return;

  const remaining = getReports().filter(function (r) { return r.id !== reportId; });
  saveReports(remaining);
  renderReports();
}
// Prevents typed text from being treated as HTML code (a basic safety measure)
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
// ---------- Handle form submission ----------

const form = document.getElementById("report-form");

form.addEventListener("submit", function (event) {
  event.preventDefault(); // stops the page from reloading
  
  const titleValue = document.getElementById("title").value.trim();
  const locationValue = document.getElementById("location").value.trim();
  const descriptionValue = document.getElementById("description").value.trim();

  if (titleValue === "" || locationValue === "" || descriptionValue === "") {
    alert("Please fill in the title, location and description (spaces alone are not enough).");
    return;
  }

  const newReport = {
    id: generateReportId(),
    title: document.getElementById("title").value.trim(),
    category: document.getElementById("category").value,
    location: document.getElementById("location").value.trim(),
    priority: document.getElementById("priority").value,
    description: document.getElementById("description").value.trim(),
    status: "Open",
    date: new Date().toLocaleString()
  };

  const reports = getReports();
  reports.push(newReport);
  saveReports(reports);
  renderReports();

  alert("Report submitted! Your Report ID is " + newReport.id);
  form.reset();
});
// ---------- Search and filter controls ----------

document.getElementById("search-input").addEventListener("input", renderReports);
document.getElementById("filter-category").addEventListener("change", renderReports);
document.getElementById("filter-status").addEventListener("change", renderReports);

document.getElementById("clear-filters").addEventListener("click", function () {
  document.getElementById("search-input").value = "";
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-status").value = "";
  renderReports();
});
// One listener on the table body catches every dropdown inside it
document.getElementById("reports-body").addEventListener("change", function (event) {
  if (event.target.classList.contains("status-select")) {
    updateStatus(event.target.dataset.id, event.target.value);
  }
});
// Catches clicks on any View or Delete button inside the table
document.getElementById("reports-body").addEventListener("click", function (event) {
  const button = event.target.closest(".action-btn");
  if (!button) return;

  if (button.dataset.action === "view") {
    openReportModal(button.dataset.id);
  } else if (button.dataset.action === "delete") {
    deleteReport(button.dataset.id);
  }
});

// Ways to close the pop-up: Close button, clicking the dark background, or Escape key
document.getElementById("modal-close").addEventListener("click", closeReportModal);

document.getElementById("modal-overlay").addEventListener("click", function (event) {
  if (event.target === this) {
    closeReportModal();
  }
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeReportModal();
  }
});
  // Show saved reports when the page first loads
renderReports();