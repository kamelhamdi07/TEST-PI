import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { bootstrapCheck } from '@ng-icons/bootstrap-icons';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { CartItem, CartService } from '../services/cart';

interface Course {
  id: string;
  category: string;
  title: string;
  details: string;
  image: string;
  price: number;
  oldPrice?: number;
}

@Component({
  selector: 'app-content',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  providers: [provideIcons({ bootstrapCheck })],
  templateUrl: './content.html',
  styleUrl: './content.css'
})
export class Content {
  showCart = false;
  addToastMessage = '';
  private toastTimeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly courses: Course[] = [
    {
      id: 'business-email-negotiation',
      category: 'Business English',
      title: 'Professional Email Writing & Negotiation Skills',
      details: '4 Lessons | 5 hours 35 minutes',
      image: 'https://media.licdn.com/dms/image/v2/D4D12AQHO3pe-LmA37g/article-cover_image-shrink_720_1280/article-cover_image-shrink_720_1280/0/1672309075415?e=2147483647&v=beta&t=kRqNRKduBcQ624caAIhliGoF869Dy5Ka9cStwz5AjnU',
      price: 0
    },
    {
      id: 'ielts-academic-intensive',
      category: 'IELTS Preparation',
      title: 'IELTS Academic Intensive: Band 7+ Guide',
      details: '2 Lessons | 4 hours 00 minutes',
      image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR7vk-1bc9m14JeWEBJUCNw_zi2xIqnVAH2_A&s',
      price: 70,
      oldPrice: 100
    },
    {
      id: 'fluent-conversations',
      category: 'Conversational English',
      title: 'Fluent Conversations: Speak English with Confidence',
      details: '2 Lessons | 5 hours 35 minutes',
      image: 'https://i.ytimg.com/vi/1n83x5g8pQk/maxresdefault.jpg',
      price: 55
    },
    {
      id: 'grammar-essay-writing',
      category: 'Writing',
      title: 'Mastering English Grammar and Essay Writing',
      details: '3 Lessons | 2 hours 40 minutes',
      image: 'https://m.universalclass.com/i/course/eslgrammarwriting/teacheslgrammarwriting43303.jpg',
      price: 60
    },
    {
      id: 'meetings-presentations',
      category: 'Business English',
      title: 'English for Meetings and Presentations',
      details: '5 Lessons | 5 hours 35 minutes',
      image: 'https://live-production.wcms.abc-cdn.net.au/414d0c628cd1c7142fa6dd39487cb688?impolicy=wcms_crop_resize&cropH=713&cropW=1268&xPos=3&yPos=0&width=862&height=485',
      price: 40
    },
    {
      id: 'american-accent-training',
      category: 'Pronunciation',
      title: 'Clear English: American Accent Training',
      details: '6 Lessons | 3 hours 35 minutes',
      image: 'https://avatars.preply.com/i/video_thumbnails/bf006528-d971-443d-99a5-d02af050acc0.png',
      price: 66
    }
  ];

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router
  ) {}

  addToCart(course: Course): void {
    this.cartService.addCourse(course.id, course.title, course.price);
    this.showAddToast(`${course.title} ajoute au panier`);
  }

  get cartItems(): CartItem[] {
    return this.cartService.getItems();
  }

  get cartTotal(): number {
    return this.cartService.getTotalAmount();
  }

  get totalCourses(): number {
    return this.cartService.getTotalCourses();
  }

  get canPay(): boolean {
    return this.totalCourses > 0;
  }

  toggleCart(): void {
    this.showCart = !this.showCart;
  }

  removeFromCart(itemId: string): void {
    this.cartService.removeCourse(itemId);
  }

  clearCart(): void {
    this.cartService.clear();
  }

  goToPayment(): void {
    if (!this.canPay) return;
    this.router.navigate(['/payment-front'], {
      queryParams: { amount: this.cartTotal, fromCart: 1, t: Date.now() }
    });
  }

  private showAddToast(message: string): void {
    this.addToastMessage = message;
    if (this.toastTimeoutId) {
      clearTimeout(this.toastTimeoutId);
    }
    this.toastTimeoutId = setTimeout(() => {
      this.addToastMessage = '';
      this.toastTimeoutId = null;
    }, 1800);
  }
}
