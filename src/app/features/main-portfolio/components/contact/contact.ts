import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslocoModule } from '@jsverse/transloco';

interface ContactMethod {
  type: string;
  icon: string;
  title: string;
  value: string;
  link: string;
  description: string;
  tooltip: string;
  external: boolean;
}

interface AvailabilityType {
  key: string;
  icon: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, TranslocoModule],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact implements OnInit {
  contactMethods: ContactMethod[] = [
    {
      type: 'email',
      icon: 'fas fa-envelope',
      title: 'contact.methods.email.title',
      value: 'zaali.mohamed3002@gmail.com',
      link: 'mailto:zaali.mohamed3002@gmail.com?subject=Hello Mohamed! Let\'s connect',
      description: 'contact.methods.email.description',
      tooltip: 'Send me an email',
      external: false
    },
    {
      type: 'whatsapp',
      icon: 'fab fa-whatsapp',
      title: 'contact.methods.whatsapp.title',
      value: '+212 605 964 917',
      link: 'https://wa.me/212605964917?text=Hi%20Mohamed!%20I%20found%20your%20portfolio%20and%20would%20love%20to%20connect.',
      description: 'contact.methods.whatsapp.description',
      tooltip: 'Message me on WhatsApp',
      external: true
    },
    {
      type: 'linkedin',
      icon: 'fab fa-linkedin',
      title: 'contact.methods.linkedin.title',
      value: 'in/m-zaali',
      link: 'https://www.linkedin.com/in/m-zaali',
      description: 'contact.methods.linkedin.description',
      tooltip: 'Connect on LinkedIn',
      external: true
    },
    {
      type: 'github',
      icon: 'fab fa-github',
      title: 'contact.methods.github.title',
      value: '@ZaaliMohamed123',
      link: 'https://github.com/ZaaliMohamed123',
      description: 'contact.methods.github.description',
      tooltip: 'View my code on GitHub',
      external: true
    }
  ];

  availabilityTypes: AvailabilityType[] = [
    { key: 'contact.availability.internships', icon: 'fas fa-graduation-cap' },
    { key: 'contact.availability.projects', icon: 'fas fa-project-diagram' },
    { key: 'contact.availability.collaborations', icon: 'fas fa-handshake' },
    { key: 'contact.availability.freelance', icon: 'fas fa-briefcase' }
  ];

  ngOnInit(): void {
    // Component initialization
  }
}
