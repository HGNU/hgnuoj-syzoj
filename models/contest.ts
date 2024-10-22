import * as TypeORM from "typeorm";
import Model from "./common";

declare var syzoj, ErrorMessage: any;

import User from "./user";
import Problem from "./problem";
import ContestRanklist from "./contest_ranklist";
import ContestPlayer from "./contest_player";

enum ContestType {
  NOI = "noi",
  IOI = "ioi",
  ICPC = "acm",
  COURSE = "cur"// mode by kaygb 20210315
}

@TypeORM.Entity()
export default class Contest extends Model {
  static cache = true;

  @TypeORM.PrimaryGeneratedColumn()
  id: number;

  @TypeORM.Column({ nullable: true, type: "varchar", length: 80 })
  title: string;

  @TypeORM.Column({ nullable: true, type: "text" })
  subtitle: string;
  
  // kaygb 20210318 below datebase
  @TypeORM.Column({ nullable: true, type: "text" })
  imgsrc: string;

  @TypeORM.Column({ nullable: true, type: "integer" })
  start_time: number;

  @TypeORM.Column({ nullable: true, type: "integer" })
  end_time: number;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  holder_id: number;

  // type: noi, ioi, acm
  @TypeORM.Column({ nullable: true, type: "enum", enum: ContestType })
  type: ContestType;

  @TypeORM.Column({ nullable: true, type: "text" })
  information: string;

  @TypeORM.Column({ nullable: true, type: "text" })
  problems: string;

  @TypeORM.Column({ nullable: true, type: "text" })
  admins: string;

  @TypeORM.Index()
  @TypeORM.Column({ nullable: true, type: "integer" })
  ranklist_id: number;

  @TypeORM.Column({ nullable: true, type: "boolean" })
  is_public: boolean;

  @TypeORM.Column({ nullable: true, type: "boolean" })
  hide_statistics: boolean;
  
  @TypeORM.Column({ nullable: true, type: "boolean" })
  is_course: boolean;

  holder?: User;
  ranklist?: ContestRanklist;

  async loadRelationships() {
    this.holder = await User.findById(this.holder_id);
    this.ranklist = await ContestRanklist.findById(this.ranklist_id);
  }

  async isSupervisior(user) {
    return user && (user.is_admin || this.holder_id === user.id || this.admins.split('|').includes(user.id.toString()));
  }

  allowedSeeingOthers() {
    if (this.type === 'acm' || this.type === 'cur' || this.type === 'ioi') return true; //mode by guke 0316
    else return false;
  }

    // 允许cur赛制显示排行榜单 mode by kaygb 20210315
  allowedShowingBoard(){
    if(this.type === 'cur') return true;
    return false;
  }


  allowedSeeingScore() { // If not, then the user can only see status
    if (this.type === 'ioi' || this.type === 'cur'  ) return true;// mode by kaygb 20210315
    else return false;
  }

  allowedSeeingResult() { // If not, then the user can only see compile progress
    if (this.type === 'ioi' || this.type === 'acm'  || this.type === 'cur') return true;// mode by kaygb 20210315
    else return false;
  }

  allowedSeeingTestcase() {
    if (this.type === 'ioi' || this.type === 'cur') return true;// mode by kaygb 20210315
    return false;
  }

  async getProblems() {
    if (!this.problems) return [];
    return this.problems.split('|').map(x => parseInt(x));
  }

  async setProblemsNoCheck(problemIDs) {
    this.problems = problemIDs.join('|');
  }

  async setProblems(s) {
    let a = [];
    await s.split('|').forEachAsync(async x => {
      let problem = await Problem.findById(x);
      if (!problem) return;
      a.push(x);
    });
    this.problems = a.join('|');
  }

  async newSubmission(judge_state) {
    if (!(judge_state.submit_time >= this.start_time && judge_state.submit_time <= this.end_time)) {
      return;
    }
    let problems = await this.getProblems();
    if (!problems.includes(judge_state.problem_id)) throw new ErrorMessage('当前比赛中无此题目。');

    await syzoj.utils.lock(['Contest::newSubmission', judge_state.user_id], async () => {
      let player = await ContestPlayer.findInContest({
        contest_id: this.id,
        user_id: judge_state.user_id
      });

      if (!player) {
        player = await ContestPlayer.create({
          contest_id: this.id,
          user_id: judge_state.user_id
        });
        await player.save();
      }

      await player.updateScore(judge_state);
      await player.save();

      await this.loadRelationships();
      await this.ranklist.updatePlayer(this, player);
      await this.ranklist.save();
    });
  }

  isRunning(now?) {
    if (!now) now = syzoj.utils.getCurrentDate();
    return now >= this.start_time && now < this.end_time;
  }

  isEnded(now?) {
    if (!now) now = syzoj.utils.getCurrentDate();
    return now >= this.end_time;
  }
}
