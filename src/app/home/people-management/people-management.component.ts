import * as _ from 'lodash';

import { Component, OnInit } from '@angular/core';
import { Modal, BSModalContext } from 'angular2-modal/plugins/bootstrap';
import { Overlay, overlayConfigFactory } from 'angular2-modal';

import { PersonService, HUMANIZED_PERSON_PROFILES } from '../../api/person/person.providers';
import { UserService } from '../../api/user/user.providers';
import { CompanyService } from '../../api/company/company.providers';
import { SocketService } from '../../api/socket/socket.service';

import { Company }  from '../../api/company/company.model';
import { Person }  from '../../api/person/person.model';

import { PersonModalComponent, PersonModalContext } from './person-modal/person-modal.component';
import { ImportModalComponent, ImportModalContext } from './import-modal/import-modal.component';

import swal from 'sweetalert2';
import * as fileSaver from 'file-saver';

@Component({
  selector: 'app-people-management',
  templateUrl: './people-management.component.html',
  styleUrls: ['./people-management.component.css']
})
export class PeopleManagementComponent implements OnInit {
  currentCompany: Company;
  persons: Person[];

  humanizedPersonProfiles = HUMANIZED_PERSON_PROFILES;
  

  constructor(private modal: Modal, 
              private userService: UserService,
              private companyService: CompanyService,
              private personService: PersonService, 
              private socketService: SocketService) { }

  ngOnInit() {
    this.socketService.get('person')
                      .subscribe((event) => {
                        if (event.action == "save")   { return this.persons.push(event.item); }
                        if (event.action == "remove") { return _.remove(this.persons, { _id: event.item._id }); }
                        if (event.action == "update") {
                          let idx = _.indexOf(this.persons, _.find(this.persons, { _id: event.item._id }));
                          
                          return this.persons.splice(idx, 1, event.item);
                        }
                      });

    this.userService.currentCompany
                      .do(currentCompany => this.currentCompany = currentCompany)
                      .flatMap(currentCompany => this.companyService.getPersons(currentCompany))
                      .subscribe(persons => this.persons = persons);
  }
  
  updatePerson(person: Person) {
    this.modal.open(PersonModalComponent, overlayConfigFactory({ action: "update", person: new Person().clone(person) }, BSModalContext));
  }

  deletePerson(person: Person){
    swal({
      title: 'Eliminar Persona?',
      html: `Estas seguro de eliminar a <strong>${person.name}</strong>?`,
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar'
    })
    .then(() => {
      this.personService.deletePerson(person).subscribe(() => {
        swal('Eliminar Persona', `${person.name} eliminada satisfactoriamente`, 'success');
      });
    }, (dismiss) => {});
  }

  createPerson() {
    this.modal.open(PersonModalComponent, overlayConfigFactory({ action: "create", person: new Person(), company: this.currentCompany }, BSModalContext));
  }
  
  importExcel() {
    this.modal.open(ImportModalComponent, overlayConfigFactory({ company: this.currentCompany }, BSModalContext));
  }
   
  exportExcel() { 
    this.companyService.exportExcel(this.currentCompany)
      .subscribe(data  => fileSaver.saveAs(data, 'people-export.xlsx'),
                 error => console.log("Error downloading the file."),
                 ()    => console.log('Completed file download.'));
  }
}
