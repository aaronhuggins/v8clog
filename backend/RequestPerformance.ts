export class RequestPerformance {
  name: string;
  start: number;
  end: number;
  get duration(): number {
    if (Number.isNaN(this.end)) {
      return (this.end = performance.now()) - this.start;
    }
    return this.end - this.start;
  }
  constructor(name: string) {
    this.start = performance.now();
    this.end = NaN;
    this.name = name;
  }
  serverTime(): string {
    return `${this.name};dur=${this.duration}`;
  }
}
