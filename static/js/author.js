$(document).ready(() => {
  const $userTable = $("#userTable").DataTable({ responsive: true });
  const $toastEl = $("#toast");
  const $toastBody = $("#toast-body");
  const toast = new bootstrap.Toast($toastEl[0]);
  const $genreForm = $("#genreForm");
  const $genreModal = $("#genreModal");
  const $categorySelect = $("#categorySelect");
  const $authorNameInput = $("#authorNameInput");
  const $genreModalLabel = $("#genreModalLabel");
  const $genreId = $("#genreId");

  const TOAST_BG_CLASSES = "bg-primary bg-success bg-danger bg-warning";

  const showToast = (message, bg = "bg-primary") => {
    $toastEl.removeClass(TOAST_BG_CLASSES).addClass(bg);
    $toastBody.text(message);
    toast.show();
  };

  const initSelect2 = (value = null) => {
    if ($categorySelect.hasClass("select2-hidden-accessible")) {
      $categorySelect.select2("destroy");
    }
    $categorySelect
      .val(value)
      .removeClass("is-invalid is-valid")
      .select2({
        placeholder: "Select a genre",
        width: "100%",
        dropdownParent: $genreModal,
      })
      .trigger("change");
  };

  // Open Add Modal and reset form
  $("#add_record").click((e) => {
    e.preventDefault();
    $genreForm[0].reset();
    $genreId.val("");
    $authorNameInput.removeClass("is-invalid is-valid");
    initSelect2(null);
    $genreForm.find(".text-danger").remove();
    $genreModalLabel.text("Add Author");
    $genreModal.modal("show");
  });

  // Initialize Select2 when modal shown (for safety, but we init on add/edit explicitly)
  $genreModal.on("shown.bs.modal", () => initSelect2());

  // Validation setup
  $genreForm.validate({
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
    errorElement: "div",
    errorClass: "text-danger small mt-1",
    onfocusout: (element) => {
      if ($(element).val()) $(element).valid();
    },
    errorPlacement: (error, element) => {
      if (element.hasClass("select2-hidden-accessible")) {
        error.insertAfter(element.next(".select2"));
      } else {
        error.insertAfter(element);
      }
    },
    highlight: (element) => $(element).addClass("is-invalid"),
    unhighlight: (element) => $(element).removeClass("is-invalid"),
    submitHandler: (form) => {
      const id = $genreId.val();
      const authorName = $authorNameInput.val().trim();
      const categoryId = $categorySelect.val();
      const url = id ? `/author/update/${id}` : "/author/create";

      $.ajax({
        url,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
          author_name: authorName,
          category_id: parseInt(categoryId, 10),
        }),
        success: (response) => {
          $genreModal.modal("hide");
          showToast(
            response.message || "Author saved successfully",
            "bg-success"
          );
          setTimeout(() => location.reload(), 1500);
        },
        error: (xhr) => {
          const msg = xhr.responseJSON?.error || "Something went wrong.";
          showToast(msg, "bg-danger");
        },
      });
    },
  });

  // Validate Select2 on change
  $categorySelect.on("change", () => $categorySelect.valid());

  // Format date columns
  const formatUSTimeDate = (dateString) => {
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
  };

  $("#userTable tbody tr").each(function () {
    const $row = $(this);
    $row
      .find(".created-at")
      .text(formatUSTimeDate($row.find(".created-at").text()));
    $row
      .find(".updated-at")
      .text(formatUSTimeDate($row.find(".updated-at").text()));
  });

  // Edit author
  $(document).on("click", ".update-btn", function () {
    const $row = $(this).closest("tr");
    const id = $row.data("id");
    const authorName = $row.find("td:nth-child(2)").text().trim();
    const categoryId = $row.data("genre-id");

    $genreId.val(id);
    $authorNameInput.val(authorName).removeClass("is-invalid is-valid");
    $genreModalLabel.text("Edit Author");

    // Initialize Select2 on modal shown with value
    $genreModal.one("shown.bs.modal", () => initSelect2(categoryId));
    $genreModal.modal("show");
  });

  // Delete author
  $(document).on("click", ".delete-btn", function () {
    const id = $(this).closest("tr").data("id");
    Swal.fire({
      title: "Are you sure?",
      text: "This will mark the author as deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    }).then((result) => {
      if (result.isConfirmed) {
        $.ajax({
          url: `/author/delete/${id}`,
          method: "POST",
          success: (response) => {
            Swal.fire("Deleted!", response.message, "success");
            setTimeout(() => location.reload(), 1000);
          },
          error: () => Swal.fire("Error!", "Could not delete author.", "error"),
        });
      }
    });
  });

  // Toggle author status
  $(document).on("change", ".status-toggle", function () {
    const id = $(this).closest("tr").data("id");
    const status = this.checked ? 1 : 0;
    $.ajax({
      url: `/author/status/${id}`,
      method: "POST",
      contentType: "application/json",
      data: JSON.stringify({ status }),
      success: (response) =>
        showToast(response.message || "Status updated", "bg-success"),
      error: () => showToast("Failed to update status", "bg-danger"),
    });
  });
});
