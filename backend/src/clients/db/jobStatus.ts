import db from "../../config/database";
import logger from "../../config/winston";
import { Prompt } from "../../types/interfaces";

interface JobStatus {
  id: number;
  request_id: string;
  cid: string;
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  attributes?: { [key: string]: string | number | boolean | Prompt[] };
  template_id?: string;
  created_at: Date;
  updated_at?: Date;
}

export const findJobStatusDb = async (requestId: string) => {
  try {
    const queryStatus = await db<JobStatus>("job_status")
      .select("id", "request_id", "status", "error", "created_at", "updated_at")
      .where({ request_id: requestId })
      .first();
    return queryStatus;
  } catch (error) {
    logger.error(`Error finding Query Status for job ${requestId}:`, error);
    return undefined;
  }
};

export const findJobStatusByCidDb = async (cid: string) => {
  try {
    const queryStatus = await db<JobStatus>("job_status")
      .select("id", "request_id", "status", "error", "created_at", "updated_at")
      .where({ cid });
    return queryStatus;
  } catch (error) {
    logger.error(`Error finding Query Status for document cid ${cid}:`, error);
    return undefined;
  }
};

export const getJobStatusPendingDb = async (
  jobIdToSkip?: string
): Promise<JobStatus[] | undefined> => {
  try {
    const query = db<JobStatus>("job_status")
      .select(
        "id",
        "request_id",
        "cid",
        "status",
        "template_id",
        "error",
        "created_at",
        "updated_at"
      )
      .where(function () {
        this.where({ status: "pending" }).orWhere({ status: "processing" });
      });

    if (jobIdToSkip) {
      query.whereNot({ request_id: jobIdToSkip });
    }

    query.orderBy("created_at", "asc");
    const queryStatus = await query;
    return queryStatus;
  } catch (error) {
    logger.error("Error finding Query Status for pending requests:", error);
    return undefined;
  }
};

export const getJobNotFinishedAndResetStatusesDb = async (): Promise<
  JobStatus[] | undefined
> => {
  try {
    // Reset statuses to "pending" for jobs that are "processing"
    await db<JobStatus>("job_status")
      .update({ status: "pending" })
      .where({ status: "processing" });
    // Fetch all jobs that are either "pending"s
    const query = db<JobStatus>("job_status")
      .select(
        "id",
        "request_id",
        "cid",
        "status",
        "template_id",
        "attributes",
        "error",
        "created_at",
        "updated_at"
      )
      .where({ status: "pending" })
      .orderBy("created_at", "asc");

    const queryStatus = await query;
    return queryStatus.map((job) => ({
      ...job,
      attributes: job.attributes
        ? JSON.parse(job.attributes as unknown as string)
        : undefined,
    }));
  } catch (error) {
    logger.error("Error finding Query Status for pending requests:", error);
    return undefined;
  }
};

export const createJobStatusDb = async ({
  requestId,
  status,
  templateId,
  attributes,
}: {
  requestId: string;
  status: "pending" | "processing" | "completed" | "failed";
  templateId?: string;
  attributes?: { [key: string]: string | number | boolean | Prompt[] };
}) => {
  try {
    const existingJob = await db<JobStatus>("job_status")
      .select("id")
      .where({ request_id: requestId })
      .first();

    if (existingJob) {
      logger.info(
        `Job with request_id ${requestId} already exists. Skipping insert.`
      );
      return;
    }

    await db<JobStatus>("job_status").insert({
      request_id: requestId,
      status,
      template_id: templateId,
      attributes,
    });
  } catch (error) {
    logger.error("Error creating query status:", error);
  }
};

export const updateJobStatusDb = async (
  requestId: string,
  status: "pending" | "processing" | "completed" | "failed",
  error?: string
) => {
  try {
    await db<JobStatus>("job_status")
      .update({
        status,
        error,
        updated_at: new Date(Date.now()),
      })
      .where({ request_id: requestId });
  } catch (error) {
    logger.error("Error during updating query status:", error);
  }
};

export const deleteMultipleJobStatusesDb = async (requestIds: string[]) => {
  try {
    await db<JobStatus>("job_status").whereIn("request_id", requestIds).del();
  } catch (error) {
    logger.error("Error during updating query status:", error);
  }
};
