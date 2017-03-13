import { environment } from '../../../environments/environment';

import { Injectable, Provider } from '@angular/core';
import { Response } from '@angular/http';
import { Resolve, ActivatedRouteSnapshot } from '@angular/router';
import { AuthHttp } from 'angular2-jwt';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

import 'rxjs/add/operator/map';
import 'rxjs/add/operator/catch';

import { AuthService } from '../auth/auth.service';

import { User }    from './user.model';
import { Company } from '../company/company.model';
import { Sector }  from '../sector/sector.model';

//-------------------------------------------------------
//                      Services
//-------------------------------------------------------


@Injectable()
export class UserService {  
  currentUser: BehaviorSubject<User>       = new BehaviorSubject<User>(null);
  currentCompany: BehaviorSubject<Company> = new BehaviorSubject<Company>(null); 
  currentSector: BehaviorSubject<Sector>   = new BehaviorSubject<Sector>(null); 
  
  constructor(private authHttp: AuthHttp) { }
  
  setCurrentUser(user: User) {
    this.currentUser.next(user);
  }

  setCurrentCompany(company: Company) {
    this.currentCompany.next(company);
  }
  
  setCurrentSector(sector: Sector) {
    this.currentSector.next(sector);
  }
  
  getMyCompanies(): Observable<Company[]> {
    return this.authHttp.get(`${environment.API_BASEURL}/api/users/me/companies`)
                        .map(res => <Company[]> res.json())
                        .catch(this.handleError);
  }
  
  getMySectors(company: Company): Observable<Sector[]> {
    return this.authHttp.get(`${environment.API_BASEURL}/api/users/me/companies/${company._id}/sectors`)
                        .map(res => <Sector[]> res.json())
                        .catch(this.handleError);
  }
      
  get(query: Object = {}) {
     let queryString = Object.keys(query).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`).join('&');
    
    return this.authHttp.get(`${environment.API_BASEURL}/api/users${queryString ? '?' + queryString : ''}`)
                        .map(res => <User[]> res.json())
                        .catch(this.handleError);
  }
  
  deleteUser(user: User){
    return this.authHttp.delete(`${environment.API_BASEURL}/api/users/${user._id}`)
                        .catch(this.handleError);
  }
  
  private handleError(error: Response) {
    console.error(error);
    return Observable.throw(error.json().error || 'Server error');
  } 

}

//-------------------------------------------------------
//                      Resolvers
//-------------------------------------------------------


@Injectable()
export class CurrentUserResolve implements Resolve<User> {
  constructor(private authService: AuthService, private userService: UserService) {}

  // before rendering anything, some Subjects are defined: currentUser, currentCompany, currentSector
  resolve(route: ActivatedRouteSnapshot) {
    return this.authService.getProfile()
                           .do(currentUser => this.userService.setCurrentUser(currentUser))
                           .flatMap(() => this.userService.getMyCompanies())
                           .do(currentUserCompanies => this.userService.setCurrentCompany(currentUserCompanies[0]))
                           .flatMap(currentUserCompanies => this.userService.getMySectors(currentUserCompanies[0]))
                           .do(firstCompanySectors => this.userService.setCurrentSector(firstCompanySectors[0]));                             
  }
}


//-------------------------------------------------------
//                      Providers
//-------------------------------------------------------

export const USER_PROVIDERS: Provider[] = [
  { provide: UserService, useClass: UserService },
  { provide: CurrentUserResolve, useClass: CurrentUserResolve }
];