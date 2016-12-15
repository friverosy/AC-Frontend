import { Injectable } from '@angular/core';
import { Http, Response, Headers } from '@angular/http';
import { Router } from '@angular/router';

import { AuthHttp, tokenNotExpired } from 'angular2-jwt';
import * as io from 'socket.io-client';

import { environment } from '../../../environments/environment';

import { User } from '../user/user.model';

import { Observable } from 'rxjs/Rx';
import 'rxjs/add/operator/mergeMap';


@Injectable()
export class AuthService {
  
  socket: any;
  
  constructor(private router: Router, private http: Http, private authHttp: AuthHttp) {
    
  }
  
  login(username: string, password: string): Observable<any> {
    console.log(`username: ${username}`);
    console.log(`password: ${password}`);
    console.log(`environment.API_BASEURL: ${environment.API_BASEURL}`)
    
    return this.http.post(`${environment.API_BASEURL}/auth/local`, {email: username, password: password}, new Headers({ 'Content-Type': 'application/json' }))
                    .map((res: Response) => {
                      let json = JSON.parse(res.text());
                      
                      console.log(`response: ${res.text()}`)
                      
                      if (!json.fail) {
                          localStorage.setItem("id_token", json.token);
                      }
    
                      this.socket = io(environment.API_BASEURL, {
                        // Send auth token on connection, you will need to DI the Auth service above
                        query: 'token=' + json.token,
                        path: '/socket.io-client'
                      });
                      
                      this.socket.on('connect', () => console.log('Connected to socket.io :D'));
                      this.socket.on('user:remove', item => console.log(`user ${item} removed. notification via socket.io`));
                      this.socket.on('user:save', item => console.log(`user ${item} saved. notification via socket.io`));
                      
                      return json.token;
                    });
                 
  }

  logout(): Observable<any> {
    localStorage.removeItem("id_token");    
    return Observable.fromPromise(this.router.navigate(['/']));
  }
  
  loggedIn() {
    return tokenNotExpired();
  }
  
	getProfile(): Observable<User> {
    return this.authHttp.get(`${environment.API_BASEURL}/api/users/me`)
              .map((res: Response) => {
                let jsonResponse = JSON.parse(res.text());
                
                let user = new User().fromJSON(jsonResponse);
                console.log(`getProfile: ${user}`)
                
                return user;
              });
	}
    
}