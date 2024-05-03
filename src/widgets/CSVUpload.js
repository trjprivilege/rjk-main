import React from "react";
import { FaUpload } from "react-icons/fa";
import Papa from "papaparse";
import { supabase } from "../supabase";
import { parse, isValid, format } from "date-fns";

const CSVUpload = ({ onUploadSuccess, onAlert }) => {
  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      onAlert("No file selected. Please choose a CSV file.", "error");
      return;
    }

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const data = results.data;

        const validData = data.filter((row) => {
          const customerCode = parseInt(row["CUSTOMER CODE"], 10);
          const netWeight = parseFloat(row["NET WEIGHT"]);
          return !isNaN(customerCode) && !isNaN(netWeight);
        });

        if (validData.length === 0) {
          onAlert(
            "Invalid CSV data. Please check CUSTOMER CODE and NET WEIGHT.",
            "error"
          );
          return;
        }

        const convertedData = validData.map((row) => {
          const customerCode = parseInt(row["CUSTOMER CODE"], 10);
          const netWeight = parseFloat(row["NET WEIGHT"]);
          const points = (netWeight / 10).toFixed(1);
          const unclaimedPoints = parseFloat(points);

          let lastSalesDate = null;
          const rawDate = row["LAST SALES DATE"];
          if (rawDate) {
            const parsedDate = parse(rawDate, "dd-MM-yyyy", new Date());
            if (isValid(parsedDate)) {
              lastSalesDate = format(parsedDate, "yyyy-MM-dd");
            }
          }

          return {
            "CUSTOMER CODE": customerCode,
            "SL NO": row["SL NO"] ? parseInt(row["SL NO"], 10) : null,
            ADDRESS1: row["ADDRESS1"] || "",
            ADDRESS2: row["ADDRESS2"] || "",
            ADDRESS3: row["ADDRESS3"] || "",
            ADDRESS4: row["ADDRESS4"] || "",
            "PIN CODE": row["PIN CODE"] || "",
            PHONE: row["PHONE"] || "",
            MOBILE: row["MOBILE"] || "",
            "TOTAL POINTS": unclaimedPoints,
            "CLAIMED POINTS": 0,
            "UNCLAIMED POINTS": unclaimedPoints,
            "LAST SALES DATE": lastSalesDate,
          };
        });

        try {
          // Fetch existing points data for customer code check
          const { data: existingData, error: fetchError } = await supabase
            .from("points")
            .select('"CUSTOMER CODE", "TOTAL POINTS", "UNCLAIMED POINTS"');

          if (fetchError) {
            onAlert("Error fetching existing data.", "error");
            return;
          }

          const updatedData = convertedData.map((newRecord) => {
            const existingRecord = existingData.find(
              (record) => record["CUSTOMER CODE"] === newRecord["CUSTOMER CODE"]
            );

            if (existingRecord) {
              const newTotalPoints = (
                parseFloat(existingRecord["TOTAL POINTS"]) +
                parseFloat(newRecord["TOTAL POINTS"])
              ).toFixed(1);

              const newUnclaimedPoints = (
                parseFloat(existingRecord["UNCLAIMED POINTS"]) +
                parseFloat(newRecord["UNCLAIMED POINTS"])
              ).toFixed(1);

              return {
                ...newRecord,
                "TOTAL POINTS": newTotalPoints,
                "UNCLAIMED POINTS": newUnclaimedPoints,
              };
            }

            return newRecord; // If new customer, return as-is
          });

          // Upsert with conflict resolution
          const { error: upsertError } = await supabase
            .from("points")
            .upsert(updatedData, {
              onConflict: "CUSTOMER CODE",
            });

          if (upsertError) {
            throw upsertError;
          }

          onAlert("Data uploaded successfully!", "success");
          if (onUploadSuccess) {
            onUploadSuccess(updatedData);
          }
        } catch (error) {
          onAlert("Error uploading data. Please try again.", "error");
        }
      },
      error: (parseError) => {
        onAlert("Error parsing CSV. Please check the file format.", "error");
      },
    });
  };

  return (
    <div>
      <input
        type="file"
        accept=".csv"
        onChange={handleUpload}
        className="hidden"
        id="csv-upload-input"
      />
      <label
        htmlFor="csv-upload-input"
        className="px-4 py-2 flex items-center gap-2 rounded-lg transition-colors duration-150 bg-red-600 text-white hover:bg-red-700"
      >
        <FaUpload />
        Upload Data
      </label>
    </div>
  );
};

export default CSVUpload;
