"""
URL routing configuration for the Finance, Invoicing, and Payment Gateway endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from apps.finance.views import (
    AccountViewSet, JournalEntryViewSet, FeeHeadViewSet,
    FeeStructureViewSet, DiscountRuleViewSet, LateFeeConfigViewSet,
    FeeInvoiceViewSet, FeePaymentViewSet, PaymentGatewayViewSet
)

router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'journal-entries', JournalEntryViewSet, basename='journal-entry')
router.register(r'fee-heads', FeeHeadViewSet, basename='fee-head')
router.register(r'fee-structures', FeeStructureViewSet, basename='fee-structure')
router.register(r'discount-rules', DiscountRuleViewSet, basename='discount-rule')
router.register(r'late-fee-configs', LateFeeConfigViewSet, basename='late-fee-config')
router.register(r'invoices', FeeInvoiceViewSet, basename='fee-invoice')
router.register(r'payments', FeePaymentViewSet, basename='fee-payment')
router.register(r'gateways', PaymentGatewayViewSet, basename='payment-gateway')

urlpatterns = [
    path('', include(router.urls)),
]
