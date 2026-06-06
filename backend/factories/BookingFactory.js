// factories/BookingFactory.js
// Design Pattern: FACTORY PATTERN
// Creates booking objects with default values
// Benefit: Centralised object creation — easy to modify booking structure in one place

class BookingFactory {

  // Create a standard booking object
  static create(propertyId, tenantId, ownerId, options = {}) {
    return {
      property: propertyId,
      tenant: tenantId,
      owner: ownerId,
      preferredDate: options.preferredDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      message: options.message || '',
      status: 'pending',
    };
  }

  // Create a booking with immediate approval (for admin use)
  static createApproved(propertyId, tenantId, ownerId, options = {}) {
    return {
      ...this.create(propertyId, tenantId, ownerId, options),
      status: 'approved',
      ownerNote: options.ownerNote || 'Auto-approved',
    };
  }

  // Create a test booking (for unit tests)
  static createForTest(overrides = {}) {
    return {
      property: overrides.propertyId || 'test-property-id',
      tenant: overrides.tenantId || 'test-tenant-id',
      owner: overrides.ownerId || 'test-owner-id',
      preferredDate: overrides.preferredDate || '2026-08-15',
      message: overrides.message || 'Test booking message',
      status: 'pending',
    };
  }
}

module.exports = BookingFactory;