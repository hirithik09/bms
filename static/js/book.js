$(document).ready(function () {
  // Initialize DataTable with responsiveness
  const dataTable = $("#bookTable").DataTable({ responsive: true });

  // Toast message generator
  function showToast(type, message) {
    const toastId = "toast" + Date.now(); // Unique ID for each toast
    const bgClass =
      type === "success"
        ? "bg-success"
        : type === "error"
        ? "bg-danger"
        : type === "warning"
        ? "bg-warning text-dark"
        : "bg-info";

    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 mb-2" role="alert" data-bs-delay="4000">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>`;
    $("#toastContainer").append(toastHtml); // Add toast to container
    const toastElement = document.getElementById(toastId);
    const bsToast = new bootstrap.Toast(toastElement);
    bsToast.show(); // Show toast
    toastElement.addEventListener(
      "hidden.bs.toast",
      () => toastElement.remove() // Remove toast after hiding
    );
  }

  // Format date to US-friendly format
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

  // Format all table dates
  function formatTableDates() {
    $("#bookTable tbody tr").each(function () {
      const createdCell = $(this).find("td").eq(7);
      const updatedCell = $(this).find("td").eq(8);
      createdCell.text(formatUSTimeDate(createdCell.text()));
      updatedCell.text(formatUSTimeDate(updatedCell.text()));
    });
  }

  formatTableDates(); // Apply date formatting on page load

  // Generate random 5-digit ISBN
  function generateISBN() {
    return Math.floor(10000 + Math.random() * 90000);
  }

  // Show modal for adding a book
  $("#add_record").click(function (e) {
    e.preventDefault();
    $("#bookForm")[0].reset(); // Reset form
    $("#bookId").val(""); // Clear ID
    $("#isbnInput").val(generateISBN()); // Set new ISBN
    $("#previewImage").html(""); // Clear image preview
    $(".is-invalid").removeClass("is-invalid"); // Remove error styles
    $("#bookModalLabel").text("Add Book");
    $("#bookModal").modal("show");
  });

  // Preview uploaded image
  $("#imageInput").on("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        $("#previewImage").html(`<img src="${e.target.result}" width="100" />`);
      };
      reader.readAsDataURL(file);
    } else {
      $("#previewImage").html("");
    }
  });

  // jQuery Validation setup
  $("#bookForm").validate({
    rules: {
      book_name: "required",
      author_id: "required",
      category_id: "required",
      stock: {
        required: true,
        number: true,
        min: 0,
      },
    },
    messages: {
      book_name: "Book name is required",
      author_id: "Please select an author",
      category_id: "Please select a genre",
      stock: {
        required: "Stock is required",
        number: "Must be a number",
        min: "Stock must be at least 0",
      },
    },
    errorPlacement: function (error, element) {
      error.addClass("text-danger small mt-1 d-block");
      error.insertAfter(element); // Place error under field
    },
    highlight: function (element) {
      $(element).addClass("is-invalid"); // Red border on error
    },
    unhighlight: function (element) {
      $(element).removeClass("is-invalid"); // Remove error border
    },

    submitHandler: function (form) {
      const formData = new FormData(form);
      const id = $("#bookId").val();
      const url = id ? `/book/update/${id}` : "/book/create"; // Use update or create URL

      $.ajax({
        url: url,
        method: "POST",
        data: formData,
        processData: false,
        contentType: false,
        success: function (response) {
          $("#bookModal").modal("hide");
          showToast("success", "Book saved successfully");
          setTimeout(() => location.reload(), 1500); // Reload after success
        },
        error: function (xhr) {
          let errorMessage = "Something went wrong";
          if (xhr.responseJSON && xhr.responseJSON.error) {
            errorMessage = xhr.responseJSON.error;
          }
          showToast("error", errorMessage); // Show error toast
        },
      });

      return false; // Prevent default form submit
    },
  });

  // Edit button logic
  $(document).on("click", ".edit-btn", function () {
    const row = $(this).closest("tr");
    const id = row.data("id");

    $.getJSON(`/book/${id}`, function (book) {
      $("#bookId").val(book.id);
      $("#bookNameInput").val(book.book_name);
      $("#isbnInput").val(book.isbn);
      $("#authorSelect").val(book.author_id);
      loadGenresForAuthor(book.author_id, function () {
        $("#genreSelect").val(book.category_id);
      });
      $("#stockInput").val(book.stock);
      $("#previewImage").html(
        book.image
          ? `<img src="/static/uploads/${book.image}" width="100" />`
          : ""
      );
      $(".is-invalid").removeClass("is-invalid");
      $("#bookModalLabel").text("Edit Book");
      $("#bookModal").modal("show");
    });
  });

  // Delete button logic
  $(document).on("click", ".delete-btn", function () {
    const id = $(this).closest("tr").data("id");

    Swal.fire({
      title: "Are you sure?",
      text: "This will mark the book as deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        $.post(`/book/delete/${id}`, function () {
          showToast("success", "Book soft deleted");
          setTimeout(() => location.reload(), 1500);
        }).fail(function () {
          showToast("error", "Delete failed");
        });
      }
    });
  });

  // Toggle status switch
  $(document).on("change", ".status-toggle", function () {
    const id = $(this).closest("tr").data("id");
    const status = this.checked ? "1" : "0";
    $.ajax({
      url: `/book/status/${id}`,
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ status: status }),
      success: function () {
        showToast("success", "Status changed");
      },
      error: function () {
        showToast("error", "Status not updated");
      },
    });
  });

  // Update genre dropdown based on selected author
  $("#authorSelect").change(function () {
    const authorId = $(this).val();
    if (!authorId) return;
    $.getJSON(`/author/${authorId}/genres`, function (data) {
      if (data.length) {
        $("#genreSelect").val(data[0].id); // Set first genre
      } else {
        $("#genreSelect").val("");
      }
    });
  });

  // Helper to load genres for edit mode
  function loadGenresForAuthor(authorId, callback) {
    if (!authorId) return callback();
    $.getJSON(`/author/${authorId}/genres`, function (data) {
      if (callback) callback(data);
    });
  }
});
