// Toggle the side navigation
const sidebarToggle = document.body.querySelector('#sidebarToggle');
if (sidebarToggle) {
    // Uncomment Below to persist sidebar toggle between refreshes
    // if (localStorage.getItem('sb|sidebar-toggle') === 'true') {
    //     document.body.classList.toggle('sb-sidenav-toggled');
    // }
    
    sidebarToggle.addEventListener('click', event => {
        event.preventDefault();
        document.body.classList.toggle('sb-sidenav-toggled');
        localStorage.setItem('sb|sidebar-toggle', document.body.classList.contains('sb-sidenav-toggled'));
    });
}

// Activate tooltips
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
    return new bootstrap.Tooltip(tooltipTriggerEl);
});

// Activate popovers
var popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
var popoverList = popoverTriggerList.map(function (popoverTriggerEl) {
    return new bootstrap.Popover(popoverTriggerEl);
});

// Auto-hide alerts
setTimeout(function() {
    var alerts = document.querySelectorAll('.alert-dismissible');
    alerts.forEach(function(alert) {
        var bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
    });
}, 5000);

// Enable data table functionality
$(document).ready(function() {
    $('#dataTable').DataTable({
        "language": {
            "url": "//cdn.datatables.net/plug-ins/1.11.5/i18n/pt-BR.json"
        },
        "responsive": true,
        "order": [[0, 'desc']]
    });
});

// File input preview
function readURL(input, previewId) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();
        
        reader.onload = function(e) {
            document.getElementById(previewId).setAttribute('src', e.target.result);
        }
        
        reader.readAsDataURL(input.files[0]);
    }
}

// Initialize select2 if available
if (typeof $().select2 === 'function') {
    $('.select2').select2({
        theme: 'bootstrap-5',
        width: '100%'
    });
}

// Initialize summernote if available
if (typeof $().summernote === 'function') {
    $('.summernote').summernote({
        height: 300,
        toolbar: [
            ['style', ['style']],
            ['font', ['bold', 'italic', 'underline', 'clear']],
            ['fontname', ['fontname']],
            ['color', ['color']],
            ['para', ['ul', 'ol', 'paragraph']],
            ['table', ['table']],
            ['insert', ['link', 'picture', 'video']],
            ['view', ['fullscreen', 'codeview', 'help']],
        ]
    });
}

// Handle form submissions with AJAX
$(document).on('submit', '.ajax-form', function(e) {
    e.preventDefault();
    
    var form = $(this);
    var formData = new FormData(this);
    var submitBtn = form.find('button[type="submit"]');
    var originalText = submitBtn.html();
    
    // Show loading state
    submitBtn.prop('disabled', true);
    submitBtn.html('<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processando...');
    
    // Clear previous alerts
    form.find('.alert').remove();
    
    $.ajax({
        url: form.attr('action'),
        type: form.attr('method'),
        data: formData,
        processData: false,
        contentType: false,
        success: function(response) {
            if (response.redirect) {
                window.location.href = response.redirect;
            } else {
                // Show success message
                var alert = '<div class="alert alert-success alert-dismissible fade show" role="alert">';
                alert += response.message || 'Operação realizada com sucesso!';
                alert += '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
                alert += '</div>';
                
                form.prepend(alert);
                
                // Reset form if needed
                if (response.resetForm) {
                    form[0].reset();
                }
                
                // Reload page if needed
                if (response.reload) {
                    setTimeout(function() {
                        window.location.reload();
                    }, 1500);
                }
            }
        },
        error: function(xhr) {
            var errorMessage = 'Ocorreu um erro ao processar sua solicitação.';
            
            try {
                var response = JSON.parse(xhr.responseText);
                if (response.errors) {
                    // Handle validation errors
                    var errorList = '<ul>';
                    $.each(response.errors, function(key, value) {
                        errorList += '<li>' + value + '</li>';
                    });
                    errorList += '</ul>';
                    errorMessage = errorList;
                } else if (response.message) {
                    errorMessage = response.message;
                }
            } catch (e) {
                console.error(e);
            }
            
            var alert = '<div class="alert alert-danger alert-dismissible fade show" role="alert">';
            alert += errorMessage;
            alert += '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>';
            alert += '</div>';
            
            form.prepend(alert);
        },
        complete: function() {
            // Reset button state
            submitBtn.prop('disabled', false);
            submitBtn.html(originalText);
            
            // Scroll to top
            $('html, body').animate({
                scrollTop: form.offset().top - 100
            }, 500);
        }
    });
});

// Handle delete buttons
$(document).on('click', '.btn-delete', function(e) {
    e.preventDefault();
    
    var button = $(this);
    var url = button.attr('href');
    var title = button.data('title') || 'Tem certeza?';
    var text = button.data('text') || 'Esta ação não pode ser desfeita!';
    var confirmText = button.data('confirm-text') || 'Sim, excluir!';
    var cancelText = button.data('cancel-text') || 'Cancelar';
    
    Swal.fire({
        title: title,
        text: text,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: confirmText,
        cancelButtonText: cancelText
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: url,
                type: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success: function(response) {
                    Swal.fire(
                        'Excluído!',
                        response.message || 'O item foi excluído com sucesso.',
                        'success'
                    ).then(() => {
                        if (response.redirect) {
                            window.location.href = response.redirect;
                        } else {
                            window.location.reload();
                        }
                    });
                },
                error: function(xhr) {
                    var errorMessage = 'Ocorreu um erro ao excluir o item.';
                    
                    try {
                        var response = JSON.parse(xhr.responseText);
                        if (response.message) {
                            errorMessage = response.message;
                        }
                    } catch (e) {
                        console.error(e);
                    }
                    
                    Swal.fire(
                        'Erro!',
                        errorMessage,
                        'error'
                    );
                }
            });
        }
    });
});
