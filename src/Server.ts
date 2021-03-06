import express from 'express';
import * as bodyParser from 'body-parser';
import morgan from 'morgan';
import cors from 'cors';
import compression from 'compression';
import helmet from 'helmet';
import 'express-async-errors';
import http from 'http';

import { errorHandler } from './utils/middleware/errorHandler';
import controllers from './controllers';
import { socketManager } from './utils/socketManager';

export default class Server {
  public readonly app: express.Application;
  public server: http.Server;

  constructor() {
    this.app = express();
    this.config();
    this.startControllers();
    this.registerErrorHandlers();
  }

  private config(): void {
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
    this.app.use(compression());
    this.app.use(helmet());

    if (process.env.NODE_ENV !== 'production') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }

    this.app.use(
      cors({
        origin: [process.env.CLIENT_URL, 'http://localhost:3001'],
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization']
      })
    );

    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || 'http://localhost';
    this.server = this.app.listen(PORT, () => {
      console.log(`
        Server is running on port: ${PORT}
        Host: ${HOST}:${PORT}
      `);
    });

    socketManager(this.server);
  }

  private startControllers(): void {
    controllers.forEach(controller => controller.register(this.app));
  }

  private registerErrorHandlers(): void {
    this.app.use(errorHandler);
  }
}
