import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('google/callback')
  googleCallback() {
    return `
      <html>
        <head><title>Authentication Successful</title></head>
        <body style="font-family: sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background-color: #f3f4f6;">
          <div style="text-align: center;">
            <h2 style="color: #4f46e5;">Authentication Successful</h2>
            <p>You can close this window now.</p>
          </div>
        </body>
      </html>
    `;
  }
}
