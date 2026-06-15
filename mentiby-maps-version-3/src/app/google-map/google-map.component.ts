import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MapService } from '../services/map.service';
import { HttpClientModule } from '@angular/common/http';
import { environment } from '../services/environment';

@Component({
  selector: 'app-google-map',
  imports: [FormsModule, HttpClientModule],
  providers : [MapService],
  templateUrl: './google-map.component.html',
  styleUrl: './google-map.component.css',
  
})
export class GoogleMapComponent implements OnInit {

  map: google.maps.Map | undefined;
  directionsService: google.maps.DirectionsService | undefined;
  directionsRenderer: google.maps.DirectionsRenderer | undefined;

  startLocation: string = '';
  destinationLocation: string = '';


  constructor(private mapservice : MapService){

  }

  ngOnInit(): void {
    this.loadGoogleMapsScript().then(() => {
      this.initMap();
    }).catch(err => {
      console.error('Failed to load Google Maps script dynamically:', err);
    });
  }

  loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google !== 'undefined' && google.maps) {
        resolve();
        return;
      }

      const existingScript = document.getElementById('google-maps-script');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', (err) => reject(err));
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-maps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  initMap(): void {
    const savedCity = localStorage.getItem('mentiby_defaultCity') || 'newyork';
    const savedZoom = parseInt(localStorage.getItem('mentiby_defaultZoom') || '13', 10);

    const cities: { [key: string]: { lat: number; lng: number } } = {
      newyork: { lat: 40.7128, lng: -74.0060 },
      london: { lat: 51.5074, lng: -0.1278 },
      newdelhi: { lat: 28.6139, lng: 77.2090 },
      paris: { lat: 48.8566, lng: 2.3522 },
      tokyo: { lat: 35.6762, lng: 139.6503 }
    };

    const centerCoords = cities[savedCity] || { lat: 40.7128, lng: -74.0060 };

    // Initialize the map
    this.map = new google.maps.Map(document.getElementById('map') as HTMLElement, {
      center: centerCoords,
      zoom: savedZoom,
      gestureHandling: 'greedy'
    });

    // Initialize Directions services
    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer();
    this.directionsRenderer.setMap(this.map);
  }

  calculateRoute(): void {
    if (this.startLocation && this.destinationLocation) {
      const currentUserName : any = localStorage.getItem('username');

      this.mapservice.sethistory(this.startLocation, this.destinationLocation, 'GoogleMap', currentUserName).subscribe({
        next: (response : any) =>{
          console.log('success');
        },
        error : (error : any) => {
          console.error('Setting record failed:', error);
        }
      });

      const savedTravelMode = localStorage.getItem('mentiby_travelMode') || 'driving';
      let googleTravelMode = google.maps.TravelMode.DRIVING;
      if (savedTravelMode === 'walking') {
        googleTravelMode = google.maps.TravelMode.WALKING;
      } else if (savedTravelMode === 'bicycling') {
        googleTravelMode = google.maps.TravelMode.BICYCLING;
      }

      const request: google.maps.DirectionsRequest = {
        origin: this.startLocation,
        destination: this.destinationLocation,
        travelMode: googleTravelMode, 
      };

      this.directionsService?.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          this.directionsRenderer?.setDirections(result);
        } else {
          alert('Unable to find the route. Please check the locations.');
        }
      });
    } else {
      alert('Please enter both start and destination locations.');
    }
  }
}
