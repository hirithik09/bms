import mysql.connector
from datetime import datetime

def get_db_connection():
    """Establishes a connection to the MySQL database."""
    return mysql.connector.connect(
        host='localhost',
        user='root',
        password='Admin@123',
        database='users'
    )

# --------------------------------------
# CATEGORY OPERATIONS
# --------------------------------------

def get_all_categories():
    """Fetches all active categories."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM category WHERE status != '2'")
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def create_category(genre):
    """Creates a new book category."""
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO category (book_category, status, created_date, updated_date)
            VALUES (%s, %s, %s, %s)
        """, (genre, '1', now, now))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def update_category(category_id, genre):
    """Updates an existing category's name."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE category
            SET book_category = %s, updated_date = NOW()
            WHERE id = %s
        """, (genre, category_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def soft_delete_category(category_id):
    """Soft deletes a category by setting status to '2'."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE category
            SET status = '2', updated_date = NOW()
            WHERE id = %s
        """, (category_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def update_category_status(category_id, status):
    """Updates the status of a category."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE category
            SET status = %s, updated_date = NOW()
            WHERE id = %s
        """, (status, category_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()
def category_exists(genre, exclude_id=None):
    """
    Check if a category already exists (case-insensitive).
    Optionally exclude a specific category ID (useful for updates).
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if exclude_id:
            query = """
                SELECT COUNT(*) FROM category
                WHERE LOWER(book_category) = LOWER(%s)
                AND status != '2' AND id != %s
            """
            cursor.execute(query, (genre, exclude_id))
        else:
            query = """
                SELECT COUNT(*) FROM category
                WHERE LOWER(book_category) = LOWER(%s)
                AND status != '2'
            """
            cursor.execute(query, (genre,))
        count = cursor.fetchone()[0]
        return count > 0
    finally:
        cursor.close()
        conn.close()

# --------------------------------------
# AUTHOR OPERATIONS
# --------------------------------------

def get_all_authors_with_category():
    """Fetches all authors with their respective category names."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT a.id, a.author_name, c.book_category, a.status,
                   a.created_date, a.updated_date
            FROM author a
            LEFT JOIN category c ON a.category_id = c.id
            WHERE a.status != '2'
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def create_author(author_name, category_id):
    """Creates a new author record."""
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO author (author_name, category_id, status, created_date, updated_date)
            VALUES (%s, %s, %s, %s, %s)
        """, (author_name, category_id, '1', now, now))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def update_author(author_id, author_name, category_id):
    """Updates an existing author's details."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE author
            SET author_name = %s, category_id = %s, updated_date = NOW()
            WHERE id = %s
        """, (author_name, category_id, author_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def soft_delete_author(author_id):
    """Soft deletes an author by setting status to '2'."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE author
            SET status = '2', updated_date = NOW()
            WHERE id = %s
        """, (author_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def update_author_status(author_id, status):
    """Updates the status of an author."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE author
            SET status = %s, updated_date = NOW()
            WHERE id = %s
        """, (status, author_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

# --------------------------------------
# BOOK OPERATIONS
# --------------------------------------

def get_all_books_with_author_and_category():
    """Fetches all books with their authors and categories."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT b.id, b.book_name, b.isbn, b.stock, b.image,
                   b.status, b.created_date, b.updated_date,
                   a.author_name,
                   c.book_category
            FROM book b
            LEFT JOIN author a ON b.author_id = a.id
            LEFT JOIN category c ON b.category_id = c.id
            WHERE b.status != '2'
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()

def get_book_by_id(book_id):
    """Fetches details of a book by ID."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT b.id, b.book_name, b.isbn, b.stock, b.image,
                   b.status, b.created_date, b.updated_date,
                   b.author_id, b.category_id
            FROM book b
            WHERE b.id = %s AND b.status != '2'
        """, (book_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        conn.close()

def create_book(book_name, isbn, author_id, category_id, stock, image_filename):
    """Creates a new book entry."""
    now = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO book (book_name, isbn, author_id, category_id, stock, image, status, created_date, updated_date)
            VALUES (%s, %s, %s, %s, %s, %s, '1', %s, %s)
        """, (book_name, isbn, author_id, category_id, stock, image_filename, now, now))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def update_book(book_id, book_name, isbn, author_id, category_id, stock, image_filename=None):
    """Updates a book's details."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        status = '0' if int(stock) == 0 else '1'
        if image_filename:
            cursor.execute("""
                UPDATE book
                SET book_name = %s,
                    isbn = %s,
                    author_id = %s,
                    category_id = %s,
                    stock = %s,
                    image = %s,
                    status = %s,
                    updated_date = NOW()
                WHERE id = %s
            """, (book_name, isbn, author_id, category_id, stock, image_filename, status, book_id))
        else:
            cursor.execute("""
                UPDATE book
                SET book_name = %s,
                    isbn = %s,
                    author_id = %s,
                    category_id = %s,
                    stock = %s,
                    status = %s,
                    updated_date = NOW()
                WHERE id = %s
            """, (book_name, isbn, author_id, category_id, stock, status, book_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def soft_delete_book(book_id):
    """Soft deletes a book by setting its status to '2'."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE book
            SET status = '2', updated_date = NOW()
            WHERE id = %s
        """, (book_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def update_book_status(book_id, status):
    """Updates the status of a book."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE book
            SET status = %s, updated_date = NOW()
            WHERE id = %s
        """, (status, book_id))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def get_genres_by_author(author_id):
    """Fetches the genre/category associated with a given author."""
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.id, c.book_category as book
            FROM author a
            JOIN category c ON a.category_id = c.id
            WHERE a.id = %s AND c.status != '2'
        """, (author_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        conn.close()
def is_duplicate_book_name(book_name, book_id=None):
    """Check if a book name already exists (case-insensitive, excludes soft-deleted)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if book_id:
            cursor.execute("""
                SELECT 1 FROM book
                WHERE LOWER(book_name) = LOWER(%s)
                  AND id != %s
                  AND status != '2'
                LIMIT 1
            """, (book_name, book_id))
        else:
            cursor.execute("""
                SELECT 1 FROM book
                WHERE LOWER(book_name) = LOWER(%s)
                  AND status != '2'
                LIMIT 1
            """, (book_name,))
        return cursor.fetchone() is not None
    finally:
        cursor.close()
        conn.close()
def is_duplicate_isbn(isbn, book_id=None):
    """Check if an ISBN already exists (case-insensitive, excludes soft-deleted)."""
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        if book_id:
            cursor.execute("""
                SELECT 1 FROM book
                WHERE LOWER(isbn) = LOWER(%s)
                  AND id != %s
                  AND status != '2'
                LIMIT 1
            """, (isbn, book_id))
        else:
            cursor.execute("""
                SELECT 1 FROM book
                WHERE LOWER(isbn) = LOWER(%s)
                  AND status != '2'
                LIMIT 1
            """, (isbn,))
        return cursor.fetchone() is not None
    finally:
        cursor.close()
        conn.close()
