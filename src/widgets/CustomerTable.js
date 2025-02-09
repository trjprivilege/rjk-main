// src/widgets/CustomerTable.jsx

import React from "react";
import ActionButtons from "./ActionButtons";

const CustomerTable = ({
  pointsData,
  onEdit,
  onDelete,
  onClaim,
  onAddGrams,
  isAdmin,
}) => {
  if (!pointsData || pointsData.length === 0) {
    return <div className="text-gray-500 p-4">No data available</div>;
  }

  return (
    <div className="overflow-x-auto bg-white border border-gray-200 rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-300 text-left">
          <tr>
            {[
              "CUSTOMER CODE",
              "ADDRESS1",
              "ADDRESS2",
              "ADDRESS3",
              "ADDRESS4",
              "MOBILE",
              "TOTAL POINTS",
              "CLAIMED POINTS",
              "UNCLAIMED POINTS",
              "LAST SALES DATE",
              isAdmin ? "Action" : null, // Conditionally render the Action column header
            ]
              .filter(Boolean) // Remove falsy values (null) from the array
              .map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 border-r border-white font-semibold"
                >
                  {header}
                </th>
              ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {pointsData.map((point, index) => (
            <tr
              key={point["CUSTOMER CODE"] || index}
              className="hover:bg-gray-100 transition-colors duration-150"
            >
              {[
                point["CUSTOMER CODE"],
                point["ADDRESS1"],
                point["ADDRESS2"],
                point["ADDRESS3"],
                point["ADDRESS4"],
                point["MOBILE"],
                point["TOTAL POINTS"],
                point["CLAIMED POINTS"],
                point["UNCLAIMED POINTS"],
                point["LAST SALES DATE"],
              ].map((value, idx) => (
                <td
                  key={idx}
                  className={`px-4 py-2 ${
                    idx < 9 ? "border-r border-gray-200" : ""
                  }`}
                >
                  {value || "0"}
                </td>
              ))}

              {isAdmin && (
                <td className="px-4 py-2">
                  <ActionButtons
                    point={point}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onClaim={onClaim}
                    onAddGrams={onAddGrams}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomerTable;
