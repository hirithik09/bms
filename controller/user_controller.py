from flask import Blueprint, render_template, request, jsonify, current_app
import os
from werkzeug.utils import secure_filename
from models import user_model

user_bp = Blueprint('user_bp', __name__)

# Basic routes for pages
@user_bp.route('/')
def base():
    """
    Render the base page.
    """
    return render_template('base.html')

@user_bp.route('/home')
def home():
    """
    Render the home page.
    """
    return render_template('home.html', active_page='home')

@user_bp.route('/about')
def about():
    """
    Render the about us page.
    """
    return render_template('aboutus.html', active_page='about')

# ---------- CATEGORY ROUTES ----------

@user_bp.route('/category')
def category():
    """
    Retrieve and display all categories.
    """
    categories = user_model.get_all_categories()
    return render_template('category.html', users=categories, active_page='category')

@user_bp.route('/category/create', methods=['POST'])
def create_category():
    """
Create a new category from JSON data and handle duplicates.
"""

    try:
        data = request.get_json()
        genre = data.get('genre').strip()

        if user_model.category_exists(genre):
            return jsonify({'error': 'Category already exists.'}), 400

        user_model.create_category(genre)
        return jsonify({'message': 'Category created successfully'}), 201

    except AttributeError as e:
        print(f"Error in create_category: {e}")
        return jsonify({'error': 'Something went wrong on the server.'}), 500



@user_bp.route('/category/update/<int:category_id>', methods=['POST'])
def update_category(category_id):
    """
    Update the genre name of an existing category by ID.

    Expects JSON payload with 'genre' key.
    
    Args:
        category_id (int): The ID of the category to update.
    """
    data = request.get_json()
    genre = data.get('genre').strip()

    if user_model.category_exists(genre, exclude_id=category_id):
        return jsonify({'error': 'Category already exists.'}), 400

    user_model.update_category(category_id, genre)
    return jsonify({'message': 'Category updated successfully'})


@user_bp.route('/category/delete/<int:category_id>', methods=['POST'])
def delete_category(category_id):
    """
    Soft delete a category by its ID.
    
    Args:
        category_id (int): The ID of the category to soft delete.
    """
    user_model.soft_delete_category(category_id)
    return jsonify({'message': 'Category soft deleted'})

@user_bp.route('/category/status/<int:category_id>', methods=['POST'])
def update_category_status(category_id):
    """
    Update the status of a category.
    
    Args:
        category_id (int): The ID of the category to update.
    """
    data = request.get_json()
    status = data.get('status')
    user_model.update_category_status(category_id, status)
    return jsonify({'message': 'Category status updated'})


# ---------- AUTHOR ROUTES ----------

@user_bp.route('/author')
def author():
    """
    Retrieve and display all authors with their categories.
    """
    authors = user_model.get_all_authors_with_category()
    categories = user_model.get_all_categories()
    return render_template('author.html', authors=authors, categories=categories, active_page='author')

@user_bp.route('/author/create', methods=['POST'])
def create_author():
    """
    Create a new author using JSON data.
    """
    data = request.get_json()
    author_name = data.get('author_name')
    category_id = data.get('category_id')

    if not author_name or not category_id:
        return jsonify({'error': 'Missing required fields'}), 400
    user_model.create_author(author_name, category_id)
    return jsonify({'message': 'Author created successfully'}), 201


@user_bp.route('/author/update/<int:author_id>', methods=['POST'])
def update_author(author_id):
    """
    Update an existing author by ID.
    
    Args:
        author_id (int): The ID of the author to update.
    """
    data = request.get_json()
    author_name = data.get('author_name')
    category_id = data.get('category_id')

    if not author_name or not category_id:
        return jsonify({'error': 'Missing required fields'}), 400

    user_model.update_author(author_id, author_name, category_id)
    return jsonify({'message': 'Author updated successfully'})


@user_bp.route('/author/delete/<int:author_id>', methods=['POST'])
def delete_author(author_id):
    """
    Soft delete an author by ID.
    
    Args:
        author_id (int): The ID of the author to soft delete.
    """
    user_model.soft_delete_author(author_id)
    return jsonify({'message': 'Author soft deleted'})


@user_bp.route('/author/status/<int:author_id>', methods=['POST'])
def update_author_status(author_id):
    """
    Update the status of an author by ID.
    
    Args:
        author_id (int): The ID of the author to update.
    """
    data = request.get_json()
    status = data.get('status')
    user_model.update_author_status(author_id, status)
    return jsonify({'message': 'Author status updated'})


# ---------- BOOK ROUTES ----------

@user_bp.route('/book')
def book():
    """
    Retrieve and display all books with their authors and categories.
    """
    books = user_model.get_all_books_with_author_and_category()
    authors = user_model.get_all_authors_with_category()
    categories = user_model.get_all_categories()
    return render_template('book.html', books=books, authors=authors, categories=categories, active_page='book')

@user_bp.route('/book/<int:book_id>')
def get_book(book_id):
    """
    Retrieve book details by its ID.
    
    Args:
        book_id (int): The ID of the book.
    
    Returns:
        JSON response with book data or error message.
    """
    book_data = user_model.get_book_by_id(book_id)
    if not book_data:
        return jsonify({'error': 'Book not found'}), 404
    return jsonify(book_data)

@user_bp.route('/book/create', methods=['POST'])
def create_book():
    """
    Create a new book using form-data including optional image upload.
    """
    book_name = request.form.get('book_name')
    isbn = request.form.get('isbn')
    author_id = request.form.get('author_id')
    category_id = request.form.get('category_id')
    stock = request.form.get('stock')
    image = request.files.get('image')

    if not book_name or not isbn or not author_id or not category_id or stock is None:
        return jsonify({'error': 'Missing required fields'}), 400

    # Use your model method to check duplicate book name
    if user_model.is_duplicate_book_name(book_name):
        return jsonify({'error': 'Book with this name already exists'}), 409

    # You also want to check duplicate ISBN separately
    if user_model.is_duplicate_isbn(isbn):
        return jsonify({'error': 'Book with this ISBN already exists'}), 409

    filename = None
    if image:
        filename = secure_filename(image.filename)
        upload_path = os.path.join(current_app.root_path, 'static/uploads', filename)
        image.save(upload_path)

    user_model.create_book(book_name, isbn, author_id, category_id, stock, filename)
    return jsonify({'message': 'Book created successfully'}), 201


@user_bp.route('/book/update/<int:book_id>', methods=['POST'])
def update_book(book_id):
    """
    Update an existing book by ID using form-data including optional image upload.
    
    Args:
        book_id (int): The ID of the book to update.
    """
    book_name = request.form.get('book_name')
    isbn = request.form.get('isbn')
    author_id = request.form.get('author_id')
    category_id = request.form.get('category_id')
    stock = request.form.get('stock')
    image = request.files.get('image')

    if not book_name or not isbn or not author_id or not category_id or stock is None:
        return jsonify({'error': 'Missing required fields'}), 400

    filename = None
    if image:
        filename = secure_filename(image.filename)
        upload_path = os.path.join(current_app.root_path, 'static/uploads', filename)
        image.save(upload_path)

    user_model.update_book(book_id, book_name, isbn, author_id, category_id, stock, filename)
    return jsonify({'message': 'Book updated successfully'})

@user_bp.route('/book/delete/<int:book_id>', methods=['POST'])
def delete_book(book_id):
    """
    Soft delete a book by its ID.
    
    Args:
        book_id (int): The ID of the book to soft delete.
    """
    user_model.soft_delete_book(book_id)
    return jsonify({'message': 'Book soft deleted'})

@user_bp.route('/book/status/<int:book_id>', methods=['POST'])
def update_book_status(book_id):
    """
    Update the status of a book by its ID.
    
    Args:
        book_id (int): The ID of the book to update.
    """
    data = request.get_json()
    status = data.get('status')
    user_model.update_book_status(book_id, status)
    return jsonify({'message': 'Book status updated'})


@user_bp.route('/author/<int:author_id>/genres')
def get_author_genres(author_id):
    """
    Retrieve genres associated with a specific author by ID.
    
    Args:
        author_id (int): The ID of the author.
    """
    genres = user_model.get_genres_by_author(author_id)
    return jsonify(genres)

@user_bp.route('/book/check_name', methods=['POST'])
def check_duplicate_book_name():
    """
    Check if a book name already exists (excluding soft-deleted books).
    Optionally exclude the current book ID (for edit forms).
    """
    data = request.get_json()
    book_name = data.get('book_name', '').strip()
    book_id = data.get('book_id')

    if not book_name:
        return jsonify({'exists': False})

    exists = user_model.is_duplicate_book_name(book_name, book_id)
    return jsonify({'exists': exists})
