import { Component, ElementRef, Input, OnInit, Renderer2, ViewChild, booleanAttribute } from '@angular/core';
import { InitialSettings } from './initial-settings.interface';
import {
  Config,
  AllSettings,
  PixelStreaming
} from '@epicgames-ps/lib-pixelstreamingfrontend-ue5.2';


@Component({
  selector: 'app-pixel-streaming-wrapper',
  templateUrl: './pixel-streaming-wrapper.component.html',
  styleUrls: ['./pixel-streaming-wrapper.component.css']
})
export class PixelStreamingWrapperComponent implements OnInit {
  @Input() initialSettings: Partial<AllSettings> | undefined = undefined;
  // A reference to parent div element that the Pixel Streaming library attaches into:
  @ViewChild('videoParent', { read: ElementRef }) videoParent:
    | ElementRef<any>
    | undefined;
  // Pixel streaming library instance is stored into this state variable after initialization:
  pixelStreaming: PixelStreaming | undefined = undefined;
  config: Config | undefined = undefined;
  // A boolean state variable that determines if the Click to play overlay is shown:
  clickToPlayVisible: boolean = true;

  constructor(
    private elementRef: ElementRef,
    private renderer: Renderer2,
  ) { }

  ngOnInit(): void {

  }

  ngAfterViewInit(): void {
    // Run on component mount: When the component's view has been initialized.

    // Attach Pixel Streaming library to videoParent element:
    if (this.videoParent?.nativeElement) {
      this.config = new Config({ initialSettings: this.initialSettings });
      // Save the library instance into component state so that it can be accessed later:
      this.pixelStreaming = new PixelStreaming(this.config, {
        videoElementParent: this.videoParent?.nativeElement
      });

      // register a playStreamRejected handler to show Click to play overlay if needed:
      this.pixelStreaming?.addEventListener('playStreamRejected', () => {
        this.clickToPlayVisible = true;
      });
    }

  }

  ngOnDestroy(): void {
    // Clean up on component unmount: Called once, before the instance is destroyed.
    this.pixelStreaming?.disconnect();
  }

}
