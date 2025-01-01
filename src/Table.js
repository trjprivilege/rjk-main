import React, { useState, useEffect } from "react";
import CustomerTable from "./widgets/CustomerTable";
import DeleteDialog from "./widgets/DeleteDialog";
import ClaimDialog from "./widgets/ClaimDialog";
import AddGramsDialog from "./widgets/AddGramsDialog";
import Edit from "./widgets/Edit";
import CSVUpload from "./widgets/CSVUpload";
import Pagination from "./widgets/Pagination";
import DownloadButton from "./widgets/DownloadButton";
import Alerts from "./widgets/Alerts";
import EditUserDialog from "./widgets/EditUserDialog";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { supabase } from "./supabase";

const ITEMS_PER_PAGE = 10;

const Table = ({ filter, isAdmin }) => {
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddGramsDialogOpen, setIsAddGramsDialogOpen] = useState(false);
  const [isEditUserDialogOpen, setIsEditUserDialogOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);
  const [alertType, setAlertType] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data with filters and pagination
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        let query = supabase
          .from("points")
          .select("*", { count: "exact" });

        // Customer Code filter (handle as integer)
        if (filter.customerCode) {
          // Try to parse as integer first
          const codeAsInt = parseInt(filter.customerCode);
          if (!isNaN(codeAsInt)) {
            query = query.eq("CUSTOMER CODE", codeAsInt);
          } else {
            // If not a valid integer, use string comparison
            query = query.textSearch("CUSTOMER CODE", filter.customerCode.trim());
          }
        }

        // Text-based filters
        if (filter.address1) {
          query = query.ilike("ADDRESS1", `%${filter.address1.trim()}%`);
        }

        if (filter.mobileNumber) {
          query = query.ilike("MOBILE", `%${filter.mobileNumber.trim()}%`);
        }

        // Numeric range filters
        if (filter.totalPointsMin) {
          query = query.gte("TOTAL POINTS", parseFloat(filter.totalPointsMin));
        }
        if (filter.totalPointsMax) {
          query = query.lte("TOTAL POINTS", parseFloat(filter.totalPointsMax));
        }
        if (filter.unclaimedPointsMin) {
          query = query.gte("UNCLAIMED POINTS", parseFloat(filter.unclaimedPointsMin));
        }
        if (filter.unclaimedPointsMax) {
          query = query.lte("UNCLAIMED POINTS", parseFloat(filter.unclaimedPointsMax));
        }

        // Date range filters
        if (filter.fromDate) {
          query = query.gte("LAST SALES DATE", filter.fromDate);
        }
        if (filter.toDate) {
          query = query.lte("LAST SALES DATE", filter.toDate);
        }

        // Sorting
        const sortColumn = filter.sortBy || "CUSTOMER CODE";
        const sortOrder = filter.sortOrder || "asc";
        query = query.order(sortColumn, { ascending: sortOrder === "ASC" });

        // Apply pagination
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE - 1;
        query = query.range(start, end);

        const { data, error, count } = await query;

        if (error) throw error;

        setFilteredData(data || []);
        setPaginatedData(data || []);
        setTotalCount(count || 0);
      } catch (error) {
        console.error("Error fetching data:", error.message);
        handleAlert("Error fetching data. Please try again.", "error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filter, currentPage]);

  // Pagination handlers
  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    const maxPage = Math.ceil(totalCount / ITEMS_PER_PAGE);
    setCurrentPage((prev) => Math.min(maxPage, prev + 1));
  };

  const handleJumpToPage = (page) => {
    const maxPage = Math.ceil(totalCount / ITEMS_PER_PAGE);
    setCurrentPage(Math.min(Math.max(1, page), maxPage));
  };

  // Alert handler
  const handleAlert = (message, type) => {
    setAlertMessage(message);
    setAlertType(type);
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setAlertMessage(null);
      setAlertType(null);
    }, 5000);
  };
  // PDF download handler
  const handleDownloadClick = () => {
    const doc = new jsPDF();
    const tableData = paginatedData.map((point) => [
      point["CUSTOMER CODE"],
      point["ADDRESS1"],
      point["ADDRESS2"],
      point["ADDRESS3"],
      point["ADDRESS4"],
      point["MOBILE"],
      parseFloat(point["TOTAL POINTS"]).toFixed(1),
      parseFloat(point["CLAIMED POINTS"]).toFixed(1),
      parseFloat(point["UNCLAIMED POINTS"]).toFixed(1),
      point["LAST SALES DATE"],
    ]);

    doc.autoTable({
      head: [
        [
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
        ],
      ],
      body: tableData,
    });

    doc.save("points_table.pdf");
  };

  // Data update handler
  const handleDataUpdate = async () => {
    setCurrentPage(1); // Reset to first page
    // Trigger a refetch by updating a dependency
    setFilteredData([]); 
  };

  // CRUD Operations
  const handleDelete = async (customerCode) => {
    try {
      const { error } = await supabase
        .from("points")
        .delete()
        .eq("CUSTOMER CODE", customerCode);

      if (error) throw error;

      handleAlert("Customer deleted successfully", "success");
      handleDataUpdate();
    } catch (error) {
      handleAlert("Error deleting customer", "error");
      console.error("Error:", error);
    }
  };

  const handleClaim = async (updatedCustomer) => {
    try {
      const { error } = await supabase
        .from("points")
        .update({
          "CLAIMED POINTS": updatedCustomer["CLAIMED POINTS"],
          "UNCLAIMED POINTS": updatedCustomer["UNCLAIMED POINTS"]
        })
        .eq("CUSTOMER CODE", updatedCustomer["CUSTOMER CODE"]);

      if (error) throw error;

      handleAlert("Points claimed successfully", "success");
      handleDataUpdate();
    } catch (error) {
      handleAlert("Error claiming points", "error");
      console.error("Error:", error);
    }
  };

  // Dialog handlers
  const handleEditDialog = (customer) => {
    setCurrentCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const handleDeleteDialog = (customer) => {
    setCurrentCustomer(customer);
    setIsDeleteDialogOpen(true);
  };

  const handleClaimDialog = (customer) => {
    setCurrentCustomer(customer);
    setIsClaimDialogOpen(true);
  };

  const handleAddGramsDialog = (customer) => {
    setCurrentCustomer(customer);
    setIsAddGramsDialogOpen(true);
  };

  return (
    <div className="min-h-screen">
      <Alerts alertMessage={alertMessage} alertType={alertType} />
      
      <div className="flex flex-wrap gap-4 mb-4">
        <DownloadButton
          pointsData={paginatedData}
          onDownload={handleDownloadClick}
          disabled={isLoading}
        />

        {isAdmin && (
          <>
            <CSVUpload
              onUploadSuccess={handleDataUpdate}
              onAlert={handleAlert}
              disabled={isLoading}
            />
            <button
              onClick={() => setIsEditUserDialogOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              disabled={isLoading}
            >
              Edit Users
            </button>
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <CustomerTable
            pointsData={paginatedData}
            isAdmin={isAdmin}
            onEdit={isAdmin ? handleEditDialog : undefined}
            onDelete={isAdmin ? handleDeleteDialog : undefined}
            onClaim={isAdmin ? handleClaimDialog : undefined}
            onAddGrams={isAdmin ? handleAddGramsDialog : undefined}
          />

          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Total Records: {totalCount}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
              onJump={handleJumpToPage}
            />
          </div>
        </>
      )}

      {/* Dialogs */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirmDelete={() => {
          handleDelete(currentCustomer["CUSTOMER CODE"]);
          setIsDeleteDialogOpen(false);
        }}
      />

      <ClaimDialog
        isOpen={isClaimDialogOpen}
        onClose={() => setIsClaimDialogOpen(false)}
        onConfirmClaim={(updatedCustomer) => {
          handleClaim(updatedCustomer);
          setIsClaimDialogOpen(false);
        }}
        customer={currentCustomer}
      />

      <AddGramsDialog
        isOpen={isAddGramsDialogOpen}
        customer={currentCustomer}
        onClose={() => setIsAddGramsDialogOpen(false)}
        onDataUpdate={handleDataUpdate}
      />

      <Edit
        isOpen={isEditDialogOpen}
        customer={currentCustomer}
        onClose={() => setIsEditDialogOpen(false)}
        onDataUpdate={handleDataUpdate}
      />

      {isAdmin && (
        <EditUserDialog
          isOpen={isEditUserDialogOpen}
          onClose={() => setIsEditUserDialogOpen(false)}
        />
      )}
    </div>
  );
};

export default Table;
