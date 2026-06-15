import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../services/login';
import { HttpClientModule } from '@angular/common/http';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [FormsModule, HttpClientModule, NgIf],
  providers : [LoginService],
  templateUrl: './login.component.html',
  standalone: true,
  styleUrl: './login.component.css'
})

export class LoginComponent {
  toggletoSignup() {
    this.router.navigate(['/sign-up'])
  }
  username : string = '';
  password : string = '';
  errorMessage: string = '';

  constructor(private router : Router,
    private loginService : LoginService
  ){
    
  }
  toggletodashboard() {
    this.router.navigate(['/dashboard'])
  }

  login() {
    this.errorMessage = '';
    if (!this.username || !this.password) {
      this.errorMessage = 'Username and password are required.';
      return;
    }
    this.loginService.login(this.username, this.password).subscribe({
      next: (response: any) => {
        console.log('Login successful:', response);
  
        const userId = response.user.username; 
        // Set token and user ID in local storage
        localStorage.setItem('username', userId.toString()); // Convert to string if it's not
        this.toggletodashboard();
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.errorMessage = error.error?.error || 'Invalid username or password. Please try again.';
      }
    });
  }
  
}

