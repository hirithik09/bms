$(document).ready(function () {
  $("#userTable").DataTable({ responsive: true });

  // Initialize Toast
  var toastElement = document.getElementById("toast");
  var toast = new bootstrap.Toast(toastElement);

  function showToast(message, bgClass = "bg-primary") {
    $("#toast")
      .removeClass("bg-primary bg-success bg-danger bg-warning")
      .addClass(bgClass);
    $("#toast-body").text(message);
    toast.show();
  }

  // Setup jQuery Validation with Toast-based error messages
  $("#genreForm").validate({
    rules: {
      genre: {
        required: true,
        minlength: 2,
      },
    },
    messages: {
      genre: {
        required: "Genre is required.",
        minlength: "Genre must be at least 2 characters.",
      },
    },
    // Disable inline error placement
    errorPlacement: function () {
      // No inline error labels
    },
    highlight: function (element) {
      $(element).addClass("is-invalid");
    },
    unhighlight: function (element) {
      $(element).removeClass("is-invalid");
    },
    invalidHandler: function (event, validator) {
      // Show first error via toast
      const firstError = validator.errorList[0];
      if (firstError) {
        showToast(firstError.message, "bg-warning");
      }
    },
    submitHandler: function (form) {
      const genre = $("#genreInput").val();
      const id = $("#genreId").val();
      const url = id ? `/category/update/${id}` : "/category/create";

      $.ajax({
        url: url,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ genre: genre }),
        success: function () {
          $("#genreModal").modal("hide");
          showToast("Genre saved successfully", "bg-success");
          setTimeout(() => location.reload(), 1500);
        },
        error: function (jqXHR) {
          const errorMsg = jqXHR.responseJSON?.error || "Something went wrong";
          showToast(errorMsg, "bg-danger");
          console.error("AJAX error details:", jqXHR.responseText);
        },
      });
    },
  });

  // Add Button Click
  $("#add_record").click(function (e) {
    e.preventDefault();
    $("#genreForm")[0].reset();
    $("#genreId").val("");
    $("#genreInput").removeClass("is-invalid");
    $("#genreModalLabel").text("Add Genre");
    $("#genreModal").modal("show");
  });

  // US time date format
  function formatUSTimeDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date)) return dateString;
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  $("#userTable tbody tr").each(function () {
    const createdCell = $(this).find(".created-at");
    const updatedCell = $(this).find(".updated-at");

    createdCell.text(formatUSTimeDate(createdCell.text()));
    updatedCell.text(formatUSTimeDate(updatedCell.text()));
  });

  // Edit Button Click
  $(document).on("click", ".update-btn", function () {
    const row = $(this).closest("tr");
    const id = row.data("id");
    const genre = row.data("genre");

    $("#genreInput").val(genre).removeClass("is-invalid");
    $("#genreId").val(id);
    $("#genreModalLabel").text("Edit Genre");
    $("#genreModal").modal("show");
  });

  // Delete Button Click
  $(document).on("click", ".delete-btn", function () {
    const id = $(this).closest("tr").data("id");

    Swal.fire({
      title: "Are you sure?",
      text: "This will mark the category as deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        $.post(`/category/delete/${id}`, function () {
          showToast("Genre soft deleted", "bg-success");
          setTimeout(() => location.reload(), 1500);
        }).fail(function (jqXHR) {
          const errorMsg = jqXHR.responseJSON?.error || "Delete failed";
          showToast(errorMsg, "bg-danger");
          console.error("Delete error:", jqXHR.responseText);
        });
      }
    });
  });

  // Status Toggle
  $(document).on("change", ".status-toggle", function () {
    const id = $(this).closest("tr").data("id");
    const status = this.checked ? "1" : "0";

    $.ajax({
      url: `/category/status/${id}`,
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ status: status }),
      success: function () {
        showToast("Status changed", "bg-success");
      },
      error: function (jqXHR) {
        const errorMsg = jqXHR.responseJSON?.error || "Status not updated";
        showToast(errorMsg, "bg-danger");
        console.error("Status toggle error:", jqXHR.responseText);
      },
    });
  });
});
