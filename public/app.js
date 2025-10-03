// Charity Events Application JavaScript

// Global variables
let allEvents = [];
let categories = [];

// API base URL
const API_BASE_URL = window.location.origin + "/api";

// Initialize the application
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

// Initialize application
async function initializeApp() {
  // Load initial data
  await loadCategories();
  await loadAllEvents();
  // Show home page by default
  showPage("home");
}
// Show specific page
function showPage(pageName) {
  // Hide all pages
  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => (page.style.display = "none"));

  // Show selected page
  const pageElement = document.getElementById(pageName + "-page");
  if (pageElement) {
    pageElement.style.display = "block";
    if (pageName === "home") {
      displayEventsByCategory();
    }
  }
}

// Load categories from API
async function loadCategories() {
  const response = await fetch(`${API_BASE_URL}/categories`);
  categories = await response.json();
}

// Load all events from API
async function loadAllEvents() {
  const response = await fetch(`${API_BASE_URL}/events`);
  allEvents = await response.json();
}

// Display events grouped by category
function displayEventsByCategory() {
  const container = document.getElementById("events-container");
  container.innerHTML = "";
  // Group events by category
  const eventsByCategory = {};
  allEvents.forEach((event) => {
    if (!eventsByCategory[event.category]) {
      eventsByCategory[event.category] = [];
    }
    eventsByCategory[event.category].push(event);
  });

  // Create category sections
  Object.keys(eventsByCategory)
    .sort()
    .forEach((category) => {
      const categorySection = createCategorySection(
        category,
        eventsByCategory[category]
      );
      container.appendChild(categorySection);
    });
}

// Create category section
function createCategorySection(category, events) {
  const section = document.createElement("div");
  section.className = "category-section";

  const header = document.createElement("div");
  header.className = "category-header";
  header.innerHTML = `
        <h3>${category.charAt(0).toUpperCase() + category.slice(1)}</h3>
    `;
  header.onclick = () => toggleCategory(section);

  const eventsContainer = document.createElement("div");
  eventsContainer.className = "category-events";

  events.forEach((event) => {
    const eventCard = createEventCard(event);
    eventsContainer.appendChild(eventCard);
  });

  section.appendChild(header);
  section.appendChild(eventsContainer);

  return section;
}

// Toggle category visibility
function toggleCategory(categorySection) {
  const eventsContainer = categorySection.querySelector(".category-events");

  if (eventsContainer.classList.contains("active")) {
    eventsContainer.classList.remove("active");
  } else {
    eventsContainer.classList.add("active");
  }
}

// Create event card
function createEventCard(event) {
  const card = document.createElement("div");
  card.className = "event-card";

  const statusClass = `status-${event.status}`;
  const progress = event.goal_amount
    ? Math.round((event.current_amount / event.goal_amount) * 100)
    : 0;

  card.innerHTML = `
        <img src="${event.image_url}" alt="${event.name}" class="event-image">
        <div class="event-info">
            <h3>${event.name}</h3>
            <div class="event-status ${statusClass}">${event.status.toUpperCase()}</div>
            <div class="event-details">
                <p><strong>Location:</strong> ${event.location}</p>
                <p><strong>Date:</strong> ${formatDate(
                  event.event_start_date
                )}-${formatDate(event.event_end_date)}
</p>
                <p><strong>Category:</strong> ${event.category}</p>
                ${
                  event.goal_amount
                    ? `<p><strong>Progress:</strong> $${event.current_amount} / $${event.goal_amount} (${progress}%)</p>`
                    : ""
                }
            </div>
            <div class="event-actions">
                <button class="btn btn-primary" onclick="showEventDetail(${
                  event.id
                })">View Details</button>
                <button class="btn btn-danger" onclick="markEventViolated(${
                  event.id
                })">Violate Policy</button>
            </div>
        </div>
    `;

  return card;
}

// Show event detail page
async function showEventDetail(eventId) {
  const response = await fetch(`${API_BASE_URL}/events/${eventId}`);

  const event = await response.json();
  displayEventDetail(event);
  showPage("event-detail");
}

// Display event details
function displayEventDetail(event) {
  const container = document.getElementById("event-detail-content");
  if (!container) return;

  const progress = event.goal_amount
    ? Math.round((event.current_amount / event.goal_amount) * 100)
    : 0;

  container.innerHTML = `
        <div class="event-detail-header">
            <img src="${event.image_url}" alt="${
    event.name
  }" class="event-detail-image">
            <div class="event-detail-info">
                <h2>${event.name}</h2>
                <div class="event-meta">
                    <p><strong>Date:</strong>${formatDate(
                      event.event_start_date
                    )}-${formatDate(event.event_end_date)}
</p>
                    <p><strong>Location:</strong> ${event.location}</p>
                    <p><strong>Category:</strong> ${event.category}</p>
                    <p><strong>Status:</strong> <span class="event-status status-${
                      event.status
                    }">${event.status.toUpperCase()}</span></p>
                </div>
            </div>
        </div>
        
        <div class="event-description">
            <h3>About This Event</h3>
            <p>${event.description}</p>
            
            <h3>Purpose</h3>
            <p>${event.purpose}</p>
        </div>
        
        ${`
            <div class="progress-section">
                <h3>Fundraising Progress</h3>
                <p>Goal: $${event.goal_amount}</p>
                <p>Current: $${event.current_amount}</p>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progress}%">${progress}%</div>
                </div>
            </div>
        `}
        
        <div class="registration-section">
            <h3>Registration Information</h3>
            <div class="ticket-info">
                <p><strong>Ticket Price:</strong> ${
                  event.ticket_price > 0 ? `$${event.ticket_price}` : "Free"
                }</p>
                ${`<p><strong>Registration Notes:</strong> ${event.registration_form}</p>`}
            </div>
            <button class="btn btn-primary" onclick="alert('This feature is currently under construction.')">Register for this Event</button>
        </div>
    `;
}

// Handle search form submission
async function handleSearch(event) {
  event.preventDefault();

  const formData = new FormData(event.target);
  const searchParams = {
    dateFrom: formData.get("dateFrom"),
    dateTo: formData.get("dateTo"),
    location: formData.get("location"),
    category: formData.get("category"),
  };

  // Validate that at least one field is filled
  if (
    !searchParams.dateFrom &&
    !searchParams.dateTo &&
    !searchParams.location &&
    !searchParams.category
  ) {
    alert("Please fill in at least one search field.");
    return;
  }

  // Build query parameters
  const params = new URLSearchParams();
  if (searchParams.dateFrom) params.append("dateFrom", searchParams.dateFrom);
  if (searchParams.dateTo) params.append("dateTo", searchParams.dateTo);
  if (searchParams.location) params.append("location", searchParams.location);
  if (searchParams.category) params.append("category", searchParams.category);

  const response = await fetch(`${API_BASE_URL}/events?${params}`);

  const results = await response.json();
  displaySearchResults(results);
}

// Display search results
function displaySearchResults(results) {
  const container = document.getElementById("search-results");
  if (!container) return;

  if (results.length === 0) {
    container.innerHTML = "<p>No events found matching your criteria.</p>";
    return;
  }

  const resultsHtml = `
        <h3>Search Results (${results.length} events found)</h3>
        <div class="events-list">
            ${results
              .map(
                (event) => `
                <div class="event-card">
                    <img src="${event.image_url}" alt="${
                  event.name
                }" class="event-image">
                    <div class="event-info">
                        <h3>${event.name}</h3>
                        <div class="event-status status-${
                          event.status
                        }">${event.status.toUpperCase()}</div>
                        <div class="event-details">
                            <p><strong>Location:</strong> ${event.location}</p>
                            <p><strong>Date:</strong> ${formatDate(
                              event.event_start_date
                            )}-${formatDate(event.event_end_date)}
</p>
                            <p><strong>Category:</strong> ${event.category}</p>
                        </div>
                        <button class="btn btn-primary" onclick="showEventDetail(${
                          event.id
                        })">View Details</button>
                    </div>
                </div>
            `
              )
              .join("")}
        </div>
    `;

  container.innerHTML = resultsHtml;
}

// Clear search form
function clearSearchForm() {
  const form = document.getElementById("search-form");
  if (form) {
    form.reset();
  }
  const resultsContainer = document.getElementById("search-results");
  if (resultsContainer) {
    resultsContainer.innerHTML = "";
  }
}

// Mark event as violated
async function markEventViolated(eventId) {
  if (
    !confirm(
      "Are you sure you want to mark this event as violated? This will hide it from the website."
    )
  ) {
    return;
  }

  await fetch(`${API_BASE_URL}/events/${eventId}/violate`, {
    method: "PUT",
  });

  // Reload events and refresh display
  await loadAllEvents();
  displayEventsByCategory();

  alert("Event marked as violated and hidden from view.");
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
