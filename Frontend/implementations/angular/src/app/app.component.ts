import { Component } from '@angular/core';
import { InitialSettings } from './pixel-streaming-wrapper/initial-settings.interface';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})


export class AppComponent {
  initialSettings: InitialSettings = {};

  ngOnInit(): void {
    this.initialSettings = {
      AutoPlayVideo: true,
      AutoConnect: true,
      ss: 'ws://localhost:80',
      StartVideoMuted: true,
      HoveringMouse: true
    }
  }
}
