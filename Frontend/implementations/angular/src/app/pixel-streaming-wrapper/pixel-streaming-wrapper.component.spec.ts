import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PixelStreamingWrapperComponent } from './pixel-streaming-wrapper.component';

describe('PixelStreamingWrapperComponent', () => {
  let component: PixelStreamingWrapperComponent;
  let fixture: ComponentFixture<PixelStreamingWrapperComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PixelStreamingWrapperComponent]
    });
    fixture = TestBed.createComponent(PixelStreamingWrapperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
