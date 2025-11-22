import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {

  constructor() {}

public searchText: string = '';

public onSearchTextChange(event: any): void {
    this.searchText = event;
    
  }

}
