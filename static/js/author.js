$(document).ready(function () {
  $("#userTable").DataTable({ responsive: true });

  // Toast setup
  const toastEl = document.getElementById("toast");
  const toast = new bootstrap.Toast(toastEl);

  function showToast(message, bg = "bg-primary") {
    $("#toast")
      .removeClass("bg-primary bg-success bg-danger bg-warning")
      .addClass(bg);
    $("#toast-body").text(message);
    toast.show();
  }

  // Open Add Modal reset
  $("#add_record").click(function (e) {
    e.preventDefault();
    $("#genreForm")[0].reset();
    $("#genreId").val("");
    $("#authorNameInput").removeClass("is-invalid");
    $("#categorySelect").removeClass("is-invalid");
    $("#genreModalLabel").text("Add Author");
    $("#genreModal").modal("show");
  });

  // Initialize Select2 WHEN modal is shown
  $("#genreModal").on("shown.bs.modal", function () {
    // Destroy previous Select2 instance if exists to avoid duplicates
    if ($("#categorySelect").hasClass("select2-hidden-accessible")) {
      $("#categorySelect").select2("destroy");
    }
    $("#categorySelect")
      .select2({
        placeholder: "Select a genre",
        width: "100%",
        dropdownParent: $("#genreModal"), // Required for modal compatibility
      })
      .trigger("change"); // force refresh
  });

  // jQuery Validation setup
  $("#genreForm").validate({
    rules: {
      authorNameInput: {
        required: true,
        minlength: 2,
      },
      categorySelect: {
        required: true,
      },
    },
    messages: {
      authorNameInput: {
        required: "Author name is required.",
        minlength: "Author name must be at least 2 characters.",
      },
      categorySelect: {
        required: "Please select a genre.",
      },
    },
    errorClass: "is-invalid",
    validClass: "is-valid",
    errorElement: "div",

    // Prevent inline error messages from showing
    errorPlacement: function () {},

    highlight: function (element) {
      $(element).addClass("is-invalid");
    },
    unhighlight: function (element) {
      $(element).removeClass("is-invalid");
    },

    // Show each error as toast
    invalidHandler: function (event, validator) {
      const errors = validator.errorList;
      if (errors.length > 0) {
        errors.forEach((err, index) => {
          setTimeout(() => {
            showToast(err.message, "bg-danger");
          }, index * 1500);
        });
      }
    },

    submitHandler: function (form) {
      const id = $("#genreId").val();
      const authorName = $("#authorNameInput").val().trim();
      const categoryId = $("#categorySelect").val();

      const url = id ? `/author/update/${id}` : "/author/create";

      $.ajax({
        url: url,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          author_name: authorName,
          category_id: parseInt(categoryId),
        }),
        success: function (response) {
          $("#genreModal").modal("hide");
          showToast(
            response.message || "Author saved successfully",
            "bg-success"
          );
          setTimeout(() => location.reload(), 1500);
        },
        error: function (xhr) {
          let msg = "Something went wrong.";
          if (xhr.responseJSON && xhr.responseJSON.error) {
            msg = xhr.responseJSON.error;
          }
          showToast(msg, "bg-danger");
        },
      });
    },
  });

  // Fix for Select2 not triggering jQuery Validate on change
  $("#categorySelect").on("change", function () {
    $(this).valid();
  });

  // Format date helper
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

  // Format dates in table
  $("#userTable tbody tr").each(function () {
    const createdCell = $(this).find(".created-at");
    const updatedCell = $(this).find(".updated-at");

    createdCell.text(formatUSTimeDate(createdCell.text()));
    updatedCell.text(formatUSTimeDate(updatedCell.text()));
  });

  // Edit Button
  $(document).on("click", ".update-btn", function () {
    const row = $(this).closest("tr");
    const id = row.data("id");
    const authorName = row.find("td:nth-child(2)").text().trim();
    const categoryId = row.data("genre-id");

    $("#genreId").val(id);
    $("#authorNameInput").val(authorName);

    // Set select2 value programmatically
    // Destroy and recreate select2 to update value correctly on modal show
    if ($("#categorySelect").hasClass("select2-hidden-accessible")) {
      $("#categorySelect").select2("destroy");
    }
    $("#categorySelect").val(categoryId);

    $("#genreModalLabel").text("Edit Author");
    $("#genreModal").modal("show");

    // Initialize select2 after modal shown and value set
    $("#genreModal").one("shown.bs.modal", function () {
      $("#categorySelect")
        .select2({
          placeholder: "Select a genre",
          width: "100%",
          dropdownParent: $("#genreModal"),
        })
        .val(categoryId)
        .trigger("change");
    });

    // Reset validation classes
    $("#authorNameInput").removeClass("is-invalid is-valid");
    $("#categorySelect").removeClass("is-invalid is-valid");
  });

  // Delete Button
  $(document).on("click", ".delete-btn", function () {
    const id = $(this).closest("tr").data("id");

    Swal.fire({
      title: "Are you sure?",
      text: "This will mark the author as deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `/author/delete/${id}`,
          method: "POST",
          success: function (response) {
            Swal.fire("Deleted!", response.message, "success");
            setTimeout(() => location.reload(), 1000);
          },
          error: function () {
            Swal.fire("Error!", "Could not delete author.", "error");
          },
        });
      }
    });
  });

  // Status toggle
  $(document).on("change", ".status-toggle", function () {
    const id = $(this).closest("tr").data("id");
    const status = this.checked ? 1 : 0;

    $.ajax({
      url: `/author/status/${id}`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ status }),
      success: function (response) {
        showToast(response.message || "Status updated", "bg-success");
      },
      error: function () {
        showToast("Failed to update status", "bg-danger");
      },
    });
  });
});
