import { Application, Request, Response } from 'express';
import { IController } from './IController';
import { ApiError } from '../utils/ApiError';
import { Vote } from '../models/Vote';
import { validateVoteInput } from '../utils/validation/vote';

export default class VoteController implements IController {
  public register(app: Application): void {
    app.get('/api/vote/:id', this.findVote);
    app.post('/api/vote/', this.createVote);
    app.post('/api/vote/:id/:header', this.SubmitVote);
    app.get('/api/votes', this.recentVotes);
  }

  private async findVote(req: Request, res: Response) {
    let vote;
    try {
      vote = await Vote.findById({ _id: req.params.id });
      const reqVote = {
        name: vote.name,
        header: vote.headers,
        results: vote.results
      };

      res.json(reqVote);
    } catch (error) {
      throw new ApiError('vote not found.', 404);
    }

    const reqVote = {
      vote: vote.id,
      name: vote.name,
      header: vote.headers,
      results: vote.results
    };

    res.json(reqVote);
  }
  private async createVote(req: Request, res: Response) {
    const { isValid, msg } = validateVoteInput(req.body);

    if (isValid === false) {
      throw new ApiError(msg, 400);
    }
    const vote = new Vote(req.body);

    vote.results = new Array();
    for (let i = 0; i < vote.headers.length; ++i) {
      vote.results[i] = 0;
    }

    const newVote = await vote.save();
    res.status(201).json(newVote);
  }
  private async SubmitVote(req: Request, res: Response) {
    let vote;
    try {
      vote = await Vote.findById({ _id: req.params.id });
      if (!vote) {
        throw new ApiError('vote not found.', 404);
      }
    } catch (error) {
      throw new ApiError('vote not found.', 404);
    }

    const headerIndex = vote.headers.indexOf(req.params.header);
    if (headerIndex === -1) {
      throw new ApiError('header not found.', 404);
    } else {
      vote.results[headerIndex]++;
      await Vote.findByIdAndUpdate(vote._id, vote);
      res.status(201).end();
    }
  }
  private async recentVotes(req: Request, res: Response) {
    let reqVotes = new Array();
    let vote = new Array();
    try {
      vote = await Vote.find({});
      if (!vote) {
        throw new ApiError('No available votes', 404);
      }
    } catch (error) {
      throw new ApiError('No available votes', 404);
    }
    for (let i = 0; i < Math.min(vote.length, 10); i++) {
      reqVotes[i] = new Vote();
      reqVotes[i].id = vote[i].id;
      reqVotes[i].name = vote[i].name;
      reqVotes[i].headers = vote[i].headers;
      reqVotes[i].results = vote[i].results;
    }
    res.status(202).json(reqVotes);
  }
}
