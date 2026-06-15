import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LoginService } from '../services/login';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-sign-up',
  providers : [LoginService],
  imports: [FormsModule, HttpClientModule, NgIf],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.css'
})
export class SignUpComponent {
  toggletoLogin() {
    this.router.navigate(['/login'])
  }
  constructor(private signupservice : LoginService,
    private router : Router
  ){

  }
  username: any = '';
  password: any = '';
  confirmpassword: any = '';
  errorMessage: string = '';

  signup() {
    this.errorMessage = '';
    if (!this.username || !this.password) {
      this.errorMessage = 'Username and password are required.';
      return;
    }
    if(this.password == this.confirmpassword){
      this.signupservice.signup(this.username, this.password).subscribe({
        next: (response : any) =>{
          this.router.navigate(['/login'])
        },
        error : (error:any) =>{
          console.log('Invalid response from backend', error);
          this.errorMessage = error.error?.error || 'Registration failed. Please try again.';
        }
      })
    }else{
      this.errorMessage = 'Password and confirm password do not match. Please try again.';
    }
  }


}

