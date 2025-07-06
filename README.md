# Travel Itinerary Planner

A simple web-based travel planning application that helps you discover and organise destinations. Search for cities, national parks, landmarks, lakes, and other points of interest, then visualize them on an interactive map.


## Features

- **Smart Search**: Search for various types of destinations including cities, national parks, landmarks, and tourist attractions
- **Interactive Map**: View all your destinations plotted on a Google Maps interface with numbered markers
- **Destination Management**: Add, remove, and reorder destinations in your itinerary
- **Real-time Preview**: See destination previews on the map as you hover over search results
- **Responsive Design**: Clean, modern interface that works on desktop and mobile devices


## Getting Started

### Prerequisites

- A Google Maps API key with the following APIs enabled:
  - **Maps JavaScript API**: For rendering the interactive map
  - **Places API**: For searching and finding destination information

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/travel-itinerary-planner.git
   cd travel-itinerary-planner
   ```

2. Add your Google Maps API key to the HTML file:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY_HERE&libraries=places&callback=initMap"></script>
   ```

3. Open `index.html` in a web browser or serve it using a local web server.
