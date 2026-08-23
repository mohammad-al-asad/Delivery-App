import { Schema, model, Document, Types } from "mongoose";

export interface IReport extends Document {
  reporter: Types.ObjectId;
  reporterRole: string;
  title: string;
  description: string;
  status: "Open" | "Resolved";
  createdAt: Date;
  updatedAt: Date;
}

const reportSchema = new Schema<IReport>(
  {
    reporter: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reporterRole: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { type: String, enum: ["Open", "Resolved"], default: "Open" },
  },
  { timestamps: true }
);

export const Report = model<IReport>("Report", reportSchema);
