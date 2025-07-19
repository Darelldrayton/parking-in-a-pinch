from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils.translation import gettext_lazy as _


class JobApplication(models.Model):
    """
    Model to store job applications submitted through the careers page.
    """
    
    class ApplicationStatus(models.TextChoices):
        NEW = 'new', _('New')
        REVIEWING = 'reviewing', _('Reviewing')
        INTERVIEW = 'interview', _('Interview')
        HIRED = 'hired', _('Hired')
        REJECTED = 'rejected', _('Rejected')
    
    class ExperienceLevel(models.TextChoices):
        ENTRY = 'Entry-level', _('Entry Level')
        MID = 'Mid-level', _('Mid Level')
        MID_SENIOR = 'Mid-Senior', _('Mid-Senior')
        SENIOR = 'Senior', _('Senior')
    
    # Personal Information
    name = models.CharField(
        _('full name'),
        max_length=100,
        help_text=_('Full name of the applicant')
    )
    email = models.EmailField(
        _('email address'),
        help_text=_('Email address of the applicant')
    )
    phone = models.CharField(
        _('phone number'),
        max_length=20,
        help_text=_('Phone number of the applicant')
    )
    
    # Position Information
    position = models.CharField(
        _('position applied for'),
        max_length=100,
        help_text=_('Position the applicant is applying for')
    )
    department = models.CharField(
        _('department'),
        max_length=50,
        help_text=_('Department of the position')
    )
    
    # Application Details
    applied_date = models.DateTimeField(
        _('application date'),
        auto_now_add=True,
        help_text=_('When the application was submitted')
    )
    status = models.CharField(
        _('application status'),
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.NEW,
        help_text=_('Current status of the application')
    )
    
    # Additional Information
    experience_level = models.CharField(
        _('experience level'),
        max_length=20,
        choices=ExperienceLevel.choices,
        blank=True,
        help_text=_('Experience level of the applicant')
    )
    location = models.CharField(
        _('location'),
        max_length=100,
        blank=True,
        help_text=_('Location of the applicant')
    )
    
    # Rating and Review
    rating = models.IntegerField(
        _('rating'),
        validators=[MinValueValidator(0), MaxValueValidator(5)],
        default=0,
        help_text=_('Rating given by the reviewer (0-5)')
    )
    
    # Links
    linkedin = models.URLField(
        _('LinkedIn URL'),
        blank=True,
        help_text=_('LinkedIn profile URL')
    )
    portfolio = models.URLField(
        _('portfolio URL'),
        blank=True,
        help_text=_('Portfolio or website URL')
    )
    
    # Cover Letter
    cover_letter = models.TextField(
        _('cover letter'),
        blank=True,
        help_text=_('Cover letter text')
    )
    
    # Resume File
    resume = models.FileField(
        _('resume'),
        upload_to='resumes/',
        blank=True,
        null=True,
        help_text=_('Resume file (PDF, DOC, DOCX)')
    )
    
    # Admin fields
    reviewed_by = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_applications',
        help_text=_('Admin who reviewed this application')
    )
    reviewed_at = models.DateTimeField(
        _('reviewed at'),
        null=True,
        blank=True,
        help_text=_('When the application was reviewed')
    )
    notes = models.TextField(
        _('admin notes'),
        blank=True,
        help_text=_('Internal notes about the application')
    )
    
    # Timestamps
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True)
    
    class Meta:
        db_table = 'job_applications'
        verbose_name = _('Job Application')
        verbose_name_plural = _('Job Applications')
        ordering = ['-applied_date']
        indexes = [
            models.Index(fields=['status', 'applied_date']),
            models.Index(fields=['department', 'position']),
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.name} - {self.position} ({self.status})"
    
    def get_resume_url(self):
        """Get the URL for the resume file."""
        if self.resume:
            return self.resume.url
        return None