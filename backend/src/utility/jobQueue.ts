/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createJobStatusDb,
  findJobStatusDb,
  getJobNotFinishedAndResetStatusesDb,
  getJobStatusPendingDb,
  updateJobStatusDb,
} from "../clients/db/jobStatus";
import logger from "../config/winston";
import { Prompt } from "../types/interfaces";

type JobStatus = "pending" | "processing" | "completed" | "failed" | null;

type JobAttributes = { [key: string]: string | number | boolean | Prompt[] };

type JobStatusResponse = {
  status: JobStatus;
  timestamp: Date;
  jobsBefore: number;
  result?: any;
  error?: any;
};

type Job = {
  id: string;
  job: () => Promise<any>;
  status: JobStatus;
  timestamp: Date;
  result?: any;
  error?: any;
};

class JobQueue {
  #queue: Job[] = [];
  #jobTemplates: { [templateId: string]: (attr: any) => Promise<any> } = {};
  #isProcessing = false;
  #useDatabase: boolean;

  constructor(useDatabase = false) {
    this.#useDatabase = useDatabase;

    if (this.#useDatabase) {
      getJobNotFinishedAndResetStatusesDb()
        .then((pendingJobs) => {
          if (pendingJobs) {
            pendingJobs.forEach((job) => {
              if (job.template_id && job.attributes) {
                this.addJobFromTemplate({
                  requestId: job.request_id,
                  templateId: job.template_id,
                  attributes: job.attributes,
                });
              }
            });
          }
        })
        .catch((error) => {
          console.error("Error loading pending jobs from database:", error);
        });
    }
  }

  addJobTemplate({
    templateId,
    job,
  }: {
    templateId: string;
    job: (attributes: JobAttributes) => Promise<any>;
  }): void {
    this.#jobTemplates[templateId] = job;
  }

  async addJob({
    templateId,
    cid,
    prompts,
    fileId,
  }: {
    templateId: "tags" | "perspectives" | "language";
    cid: string;
    prompts: Prompt[];
    fileId: string;
  }) {
    const requestId = this.#generateRequestId(cid, templateId);
    this.addJobFromTemplate({
      requestId,
      templateId,
      attributes: { cid, prompts, requestId, fileId },
    });
    return requestId;
  }

  async addJobFromTemplate({
    requestId,
    templateId,
    attributes,
  }: {
    requestId: string;
    templateId: string;
    attributes: JobAttributes;
  }): Promise<string | undefined> {
    const jobTemplate = this.#jobTemplates[templateId];
    if (!jobTemplate) {
      logger.error(
        `Job template "${templateId}" not found for job ${requestId}.`
      );
      return;
    }

    return this.#enqueueJob(
      requestId,
      () => jobTemplate(attributes),
      templateId,
      attributes
    );
  }

  async updateJobStatus(
    jobId: string,
    status: "pending" | "processing" | "completed" | "failed",
    error?: string
  ) {
    return updateJobStatusDb(jobId, status, error);
  }

  async #enqueueJob(
    requestId: string,
    job: () => Promise<any>,
    templateId?: string,
    attributes?: JobAttributes
  ): Promise<string> {
    const jobObject: Job = {
      id: requestId,
      job,
      status: this.#useDatabase ? null : "pending",
      timestamp: new Date(),
    };
    this.#queue.push(jobObject);

    if (this.#useDatabase) {
      // If using a database, create a new entry for the job
      await createJobStatusDb({
        requestId,
        status: "pending",
        templateId,
        attributes,
      });
    }
    this.#processQueue();
    return jobObject.id;
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse | undefined> {
    if (this.#useDatabase) {
      const jobStatus = await findJobStatusDb(jobId);
      const queue = await getJobStatusPendingDb(jobId);

      if (!jobStatus) {
        return undefined;
      }
      return {
        status: jobStatus.status,
        timestamp: jobStatus.created_at,
        jobsBefore: jobStatus.status === "pending" ? queue?.length || -1 : -1,
        result: null,
        error: jobStatus.error,
      };
    }

    const foundJob = this.#queue.find((job) => job.id === jobId);
    if (foundJob) {
      return {
        status: foundJob.status,
        timestamp: foundJob.timestamp,
        jobsBefore:
          foundJob.status === "pending"
            ? this.#queue.findIndex((jobLoop) => jobLoop.id === foundJob.id)
            : -1,
        result: foundJob.result,
        error: foundJob.error,
      };
    }
  }

  async #processQueue(): Promise<void> {
    if (this.#isProcessing) return;
    this.#isProcessing = true;
    logger.debug(`Starting to process queue: ${this.#queue.length}`);

    while (this.#queue.length > 0) {
      const job = this.#queue[0];
      if (this.#useDatabase) {
        const status = await findJobStatusDb(job.id);
        if (status) {
          job.status = status.status;
        }
      }

      if (job.status === "pending") {
        job.status = "processing";
        await updateJobStatusDb(job.id, "processing");
        try {
          logger.debug(`Processing job ${job.id}...`);
          const response = await job.job();
          job.result = response;
          job.status = "completed";
          logger.debug(`Processing job ${job.id} complete.`);
        } catch (error) {
          job.error = error;
          job.status = "failed";
          logger.warn(`Processing job ${job.id} failed.`);
        }
      }
      this.#queue.shift();
    }

    this.#isProcessing = false;
  }

  #generateRequestId = (
    cid: string,
    type: "perspectives" | "tags" | "language"
  ): string => {
    return `req_${type}_${cid}`;
  };
}

export default new JobQueue(true);
