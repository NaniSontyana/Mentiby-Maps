import { Component } from '@angular/core';
import { Router, RouterOutlet} from '@angular/router';
import { LoginComponent } from "../login/login.component";

@Component({
  selector: 'app-dashboard',
  imports: [RouterOutlet],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent {
  currentUserName: any;
  isMapsDropdownOpen = false;

  constructor(public router:Router){
    this.currentUserName = localStorage.getItem('username')
  }

  loggout() {
    localStorage.removeItem('username')
    this.router.navigate(['/landing-page'])
  }

  toggletoGoogleMap() {
    this.isMapsDropdownOpen = false;
    this.router.navigate(['/dashboard/google-maps'])
  }
  toogletohome() {
    this.isMapsDropdownOpen = false;
    this.router.navigate(['/dashboard/home'])
  }

  toggletoMap() {
    this.isMapsDropdownOpen = false;
    this.router.navigate(['/dashboard/map'])
  }

  toggletoSettings() {
    this.isMapsDropdownOpen = false;
    this.router.navigate(['/dashboard/settings'])
  }

  toggleMapsDropdown(event: MouseEvent) {
    event.preventDefault();
    this.isMapsDropdownOpen = !this.isMapsDropdownOpen;
  }
}
