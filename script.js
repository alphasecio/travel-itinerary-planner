let destinations = [];
let map;
let markers = [];
let previewMarker = null;
let selectedDestination = null;
let searchTimeout = null;

// Initialize the map
function initMap() {
    // Create a simple div for Google Maps
    const mapDiv = document.getElementById('map');

    map = new google.maps.Map(mapDiv, {
        center: { lat: 39.8283, lng: -98.5795 },
        zoom: 4,
        mapTypeId: 'roadmap'
    });
}

// Search for places using Google Places API (cities, landmarks, parks, etc.)
async function searchDestinations(query) {
    if (query.length < 3) {
        hideSearchResults();
        return;
    }

    if (!window.google || !google.maps.places) {
        console.error('Google Places API not available');
        hideSearchResults();
        return;
    }

    const service = new google.maps.places.PlacesService(map);

    // Search for various types of places
    const request = {
        query: query,
        fields: ['name', 'formatted_address', 'geometry', 'types', 'photos'],
        // Remove type restriction to allow all place types
    };

    service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            // Filter and prioritize different types of places
            const formattedResults = results.slice(0, 8).map(place => {
                // Determine place type for display
                let placeType = 'Place';
                if (place.types.includes('locality') || place.types.includes('administrative_area_level_1')) {
                    placeType = 'City';
                } else if (place.types.includes('natural_feature')) {
                    placeType = 'Natural Feature';
                } else if (place.types.includes('park')) {
                    placeType = 'Park';
                } else if (place.types.includes('tourist_attraction')) {
                    placeType = 'Attraction';
                } else if (place.types.includes('establishment')) {
                    placeType = 'Landmark';
                }

                return {
                    name: place.name,
                    display_name: place.formatted_address,
                    lat: place.geometry.location.lat(),
                    lon: place.geometry.location.lng(),
                    type: placeType,
                    types: place.types
                };
            });

            displaySearchResults(formattedResults);
        } else {
            console.error('Places search failed:', status);
            hideSearchResults();
        }
    });
}

// Display search results
function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');

    if (results.length === 0) {
        hideSearchResults();
        return;
    }

    searchResults.innerHTML = '';

    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'search-result-item';

        const displayName = result.display_name.split(',').slice(0, 3).join(', ');
        const name = result.name || result.display_name.split(',')[0];
        const placeType = result.type || 'Place';

        item.innerHTML = `
            <div class="search-result-name">${name}</div>
            <div class="search-result-type" style="color: #666; font-size: 0.8em; font-style: italic;">${placeType}</div>
            <div class="search-result-details">${displayName}</div>
        `;

        item.addEventListener('click', () => {
            selectDestination(result);
        });

        item.addEventListener('mouseenter', () => {
            showPreview(result);
        });

        searchResults.appendChild(item);
    });

    searchResults.style.display = 'block';
}

// Hide search results
function hideSearchResults() {
    const searchResults = document.getElementById('searchResults');
    searchResults.style.display = 'none';
    clearPreview();
}

// Show preview on map
function showPreview(result) {
    clearPreview();

    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    previewMarker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 12,
            fillColor: '#28a745',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
        }
    });

    map.setCenter({ lat: lat, lng: lng });
    map.setZoom(10);
}

// Clear preview
function clearPreview() {
    if (previewMarker) {
        previewMarker.setMap(null);
        previewMarker = null;
    }
}

// Select a destination
function selectDestination(result) {
    selectedDestination = {
        name: result.name || result.display_name.split(',')[0],
        displayName: result.display_name.split(',').slice(0, 3).join(', '),
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        type: result.type || 'Place'
    };

    document.getElementById('destinationName').value = selectedDestination.name;
    document.getElementById('addDestinationBtn').disabled = false;
    hideSearchResults();

    // Keep the preview marker as the selected destination
    if (previewMarker) {
        const typeLabel = selectedDestination.type ? ` (${selectedDestination.type})` : '';
        const infoWindow = new google.maps.InfoWindow({
            content: `<b>${selectedDestination.name}${typeLabel}</b><br>${selectedDestination.displayName}`
        });
        infoWindow.open(map, previewMarker);
    }
}

// Add a new destination
function addDestination() {
    if (!selectedDestination) return;

    destinations.push(selectedDestination);

    // Clear form and selection
    document.getElementById('destinationName').value = '';
    document.getElementById('addDestinationBtn').disabled = true;
    selectedDestination = null;
    clearPreview();

    updateDisplay();
}

// Remove a destination
function removeDestination(index) {
    destinations.splice(index, 1);
    updateDisplay();
}

// Update the destination list display
function updateDestinationList() {
    const container = document.getElementById('destinationListContainer');

    if (destinations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No destinations added yet</h3>
                <p>Start typing to search for cities, national parks, lakes, and other destinations to add to your itinerary.</p>
            </div>
        `;
        return;
    }

    const destinationList = document.createElement('ul');
    destinationList.className = 'destination-list';

    destinations.forEach((destination, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'destination-item';
        const placeType = destination.type ? ` (${destination.type})` : '';
        listItem.innerHTML = `
            <div class="destination-info">
                <div>
                    <span class="destination-number">${index + 1}.</span>
                    <span class="destination-name">${destination.name}${placeType}</span>
                </div>
                <div class="destination-details">${destination.displayName}</div>
            </div>
            <button class="remove-btn" onclick="removeDestination(${index})">Remove</button>
        `;
        destinationList.appendChild(listItem);
    });

    container.innerHTML = '';
    container.appendChild(destinationList);
}

// Update the map
function updateMap() {
    // Clear existing markers only
    markers.forEach(marker => marker.setMap(null));
    markers = [];

    if (destinations.length === 0) {
        map.setCenter({ lat: 39.8283, lng: -98.5795 });
        map.setZoom(4);
        return;
    }

    // Add numbered markers
    const bounds = new google.maps.LatLngBounds();

    destinations.forEach((destination, index) => {
        const position = { lat: destination.lat, lng: destination.lng };

        const marker = new google.maps.Marker({
            position: position,
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 15,
                fillColor: '#007bff',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2
            },
            label: {
                text: (index + 1).toString(),
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '14px'
            }
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<b>${index + 1}. ${destination.name}</b><br>${destination.displayName}${destination.type ? `<br><em>${destination.type}</em>` : ''}`
        });

        marker.addListener('click', () => {
            infoWindow.open(map, marker);
        });

        markers.push(marker);
        bounds.extend(position);
    });

    // Fit map to show all destinations
    if (destinations.length > 0) {
        map.fitBounds(bounds);
        if (destinations.length === 1) {
            map.setZoom(10);
        }
    }
}

// Update both list and map
function updateDisplay() {
    updateDestinationList();
    updateMap();
}

// Handle input events
document.addEventListener('DOMContentLoaded', function() {
    const destinationNameInput = document.getElementById('destinationName');

    destinationNameInput.addEventListener('input', function(e) {
        const query = e.target.value.trim();

        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        // Reset button state
        document.getElementById('addDestinationBtn').disabled = true;
        selectedDestination = null;

        // Debounce search
        if (query.length >= 3) {
            searchTimeout = setTimeout(() => {
                searchDestinations(query);
            }, 300);
        } else {
            hideSearchResults();
        }
    });

    destinationNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !document.getElementById('addDestinationBtn').disabled) {
            addDestination();
        }
    });

    // Hide search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.form-group')) {
            hideSearchResults();
        }
    });
});

// Initialize the application
initMap();
