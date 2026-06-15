import { Component, OnInit } from '@angular/core';
import * as L from 'leaflet';
import axios from 'axios';
import { FormsModule } from '@angular/forms';
import { MapService } from '../services/map.service';
import { HttpClientModule } from '@angular/common/http';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-map',
  standalone: true,
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css'],
  imports : [FormsModule, HttpClientModule, NgIf],
  providers : [MapService]
})

export class MapComponent implements OnInit {
  map!: L.Map;
  startLocation: string = '';
  destinationLocation: string = '';
  routeLayer: L.LayerGroup | null = null;
  routeDistance: string = '';
  routeDuration: string = '';

  cities: { [key: string]: [number, number] } = {
    newyork: [40.7128, -74.0060],
    london: [51.5074, -0.1278],
    newdelhi: [28.6139, 77.2090],
    paris: [48.8566, 2.3522],
    tokyo: [35.6762, 139.6503]
  };

  tileLayers: { [key: string]: { url: string; attr: string } } = {
    standard: {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attr: '© OpenStreetMap contributors'
    },
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attr: '© OpenStreetMap contributors, © CartoDB'
    },
    satellite: {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attr: 'Tiles &copy; Esri'
    }
  };

  constructor(private mapservice : MapService){

  }

  ngOnInit(): void {
    const iconDefault = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });
    L.Marker.prototype.options.icon = iconDefault;

    const savedTheme = localStorage.getItem('mentiby_mapTheme') || 'standard';
    const savedCity = localStorage.getItem('mentiby_defaultCity') || 'newyork';
    const savedZoom = parseInt(localStorage.getItem('mentiby_defaultZoom') || '13', 10);

    const centerCoords = this.cities[savedCity] || [40.7128, -74.0060];
    const layerConfig = this.tileLayers[savedTheme] || this.tileLayers['standard'];

    this.map = L.map('map', {
      scrollWheelZoom: false, // Disable native scroll zooming to handle custom trackpad gestures
      worldCopyJump: true,    // Endless scroll like a globe with markers wrapping around
      zoomSnap: 0.25,
      zoomDelta: 0.5,
      inertia: true,
      inertiaDeceleration: 3000,
      inertiaMaxSpeed: 1500,
      easeLinearity: 0.2
    }).setView(centerCoords, savedZoom);
    L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attr
    }).addTo(this.map);

    // Register custom wheel event listener on Leaflet container to support trackpad panning
    const mapContainer = document.getElementById('map') as HTMLElement;
    if (mapContainer) {
      mapContainer.addEventListener('wheel', (e: WheelEvent) => {
        e.preventDefault();
        if (e.ctrlKey) {
          // Pinch-zoom or Ctrl+scroll zooms the map
          const currentZoom = this.map.getZoom();
          const zoomDelta = e.deltaY < 0 ? 0.25 : -0.25;
          this.map.setZoom(currentZoom + zoomDelta);
        } else {
          // Two-finger drag or mouse wheel pans the map smoothly
          this.map.panBy([e.deltaX, e.deltaY], { animate: false });
        }
      }, { passive: false });
    }

    setTimeout(() => {
      this.map.invalidateSize();
    }, 0);
  }

  async geocode(address: string): Promise<L.LatLng | null> {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          q: address,
          format: 'json',
        },
      });

      if (response.data && response.data.length > 0) {
        const { lat, lon } = response.data[0];
        return L.latLng(parseFloat(lat), parseFloat(lon));
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  }

  async calculateRoute() {
    if (!this.startLocation || !this.destinationLocation) {
      alert('Please enter both start and destination locations.');
      return;
    }

    this.routeDistance = '';
    this.routeDuration = '';

    const currentUserName : any = localStorage.getItem('username')

    this.mapservice.sethistory(this.startLocation, this.destinationLocation, 'NormalMap', currentUserName).subscribe({
      next: (response : any) => {
        console.log('success')
      },
      error : (error : any) => {
        console.error('Setting record failed:', error);
      }
    })

    const startCoords = await this.geocode(this.startLocation);
    const destinationCoords = await this.geocode(this.destinationLocation);

    if (!startCoords || !destinationCoords) {
      alert('Unable to find one or both locations.');
      return;
    }

    try {
      // Get saved travel mode and map it to OSRM profiles (driving, walking, bicycle)
      const savedTravelMode = localStorage.getItem('mentiby_travelMode') || 'driving';
      const osrmProfile = savedTravelMode === 'bicycling' ? 'bicycle' : savedTravelMode;

      // Call OSRM API for driving/walking/cycling routing
      const response = await axios.get(
        `https://router.project-osrm.org/route/v1/${osrmProfile}/${startCoords.lng},${startCoords.lat};${destinationCoords.lng},${destinationCoords.lat}`,
        {
          params: {
            overview: 'full',
            geometries: 'geojson',
          },
        }
      );

      if (response.data && response.data.routes && response.data.routes.length > 0) {
        const routeData = response.data.routes[0];
        const coords = routeData.geometry.coordinates;
        // OSRM returns coordinates as [lng, lat], convert to [lat, lng] for Leaflet
        const latLngs = coords.map((c: [number, number]) => L.latLng(c[1], c[0]));

        if (this.routeLayer) {
          this.map.removeLayer(this.routeLayer);
        }

        this.routeLayer = L.layerGroup().addTo(this.map);

        const route = L.polyline(latLngs, {
          color: '#6366f1', // Indigo accent color
          weight: 5,
          opacity: 0.8,
        }).addTo(this.routeLayer);

        this.map.fitBounds(route.getBounds());

        L.marker(startCoords).addTo(this.routeLayer).bindPopup('Start: ' + this.startLocation).openPopup();
        L.marker(destinationCoords).addTo(this.routeLayer).bindPopup('Destination: ' + this.destinationLocation);

        // Format and display distance and duration
        const distanceMeters = routeData.distance; // meters
        const durationSeconds = routeData.duration; // seconds

        const isImperial = localStorage.getItem('mentiby_distanceUnit') === 'imperial';
        if (isImperial) {
          const miles = (distanceMeters / 1609.34).toFixed(1);
          this.routeDistance = `${miles} miles`;
        } else {
          const km = (distanceMeters / 1000).toFixed(1);
          this.routeDistance = `${km} km`;
        }

        const mins = Math.round(durationSeconds / 60);
        if (mins >= 60) {
          const hrs = Math.floor(mins / 60);
          const remainingMins = mins % 60;
          this.routeDuration = `${hrs} hr ${remainingMins} min`;
        } else {
          this.routeDuration = `${mins} min`;
        }
      } else {
        this.drawStraightLineRoute(startCoords, destinationCoords);
      }
    } catch (error) {
      console.warn('OSRM routing failed, falling back to straight line route:', error);
      this.drawStraightLineRoute(startCoords, destinationCoords);
    }
  }

  drawStraightLineRoute(startCoords: L.LatLng, destinationCoords: L.LatLng) {
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }

    this.routeLayer = L.layerGroup().addTo(this.map);

    const route = L.polyline([startCoords, destinationCoords], {
      color: '#6366f1',
      weight: 4,
      opacity: 0.7,
    }).addTo(this.routeLayer);

    this.map.fitBounds(route.getBounds());

    L.marker(startCoords).addTo(this.routeLayer).bindPopup('Start: ' + this.startLocation).openPopup();
    L.marker(destinationCoords).addTo(this.routeLayer).bindPopup('Destination: ' + this.destinationLocation);

    this.routeDistance = 'Calculated via straight line';
    this.routeDuration = 'N/A';
  }
}

