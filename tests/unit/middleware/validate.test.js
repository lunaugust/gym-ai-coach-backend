const ApiError = require('../../../src/utils/ApiError');

// Mock the validate middleware
const validate = require('../../../src/middleware/validate');

describe('validate middleware', () => {
  let mockReq;
  let mockRes;
  let mockNext;
  let mockSchema;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockReq = {
      body: {},
      params: {},
      query: {},
    };
    
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    
    mockNext = jest.fn();
    
    // Mock Joi schema
    mockSchema = {
      validate: jest.fn(),
    };
  });

  describe('validate middleware function', () => {
    it('should call next() when validation passes', () => {
      const validatedData = { name: 'John Doe', age: 30 };
      mockSchema.validate.mockReturnValue({ error: undefined, value: validatedData });
      mockReq.body = { name: 'John Doe', age: 30 };

      validate(mockSchema)(mockReq, mockRes, mockNext);

      expect(mockSchema.validate).toHaveBeenCalledWith(mockReq.body, {
        abortEarly: false,
        stripUnknown: true
      });
      expect(mockReq.body).toEqual(validatedData);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should call next() with ApiError when validation fails', () => {
      const validationError = new Error('Validation failed');
      validationError.details = [{ message: 'Name is required' }];
      mockSchema.validate.mockReturnValue({ 
        error: validationError, 
        value: undefined 
      });
      mockReq.body = { age: 30 }; // Missing name

      validate(mockSchema)(mockReq, mockRes, mockNext);

      expect(mockSchema.validate).toHaveBeenCalledWith(mockReq.body, {
        abortEarly: false,
        stripUnknown: true
      });
      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Validation Failed'
        })
      );
    });

    it('should handle validation with custom error messages', () => {
      const validationError = new Error('Validation failed');
      validationError.details = [{ message: 'Invalid email format' }];
      mockSchema.validate.mockReturnValue({ 
        error: validationError, 
        value: undefined 
      });
      mockReq.body = { email: 'invalid-email' };

      validate(mockSchema)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Validation Failed'
        })
      );
    });

    it('should handle multiple validation errors', () => {
      const validationError = new Error('Validation failed');
      validationError.details = [
        { message: 'Name is required' },
        { message: 'Age must be a number' }
      ];
      mockSchema.validate.mockReturnValue({ 
        error: validationError, 
        value: undefined 
      });
      mockReq.body = { age: 'not-a-number' };

      validate(mockSchema)(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'Validation Failed'
        })
      );
    });

    it('should handle empty request body', () => {
      const validatedData = {};
      mockSchema.validate.mockReturnValue({ error: undefined, value: validatedData });
      mockReq.body = {};

      validate(mockSchema)(mockReq, mockRes, mockNext);

      expect(mockSchema.validate).toHaveBeenCalledWith({}, {
        abortEarly: false,
        stripUnknown: true
      });
      expect(mockReq.body).toEqual({});
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle null request body', () => {
      const validatedData = {};
      mockSchema.validate.mockReturnValue({ error: undefined, value: validatedData });
      mockReq.body = null;

      validate(mockSchema)(mockReq, mockRes, mockNext);

      expect(mockSchema.validate).toHaveBeenCalledWith(null, {
        abortEarly: false,
        stripUnknown: true
      });
      expect(mockReq.body).toEqual({});
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should handle undefined request body', () => {
      const validatedData = {};
      mockSchema.validate.mockReturnValue({ error: undefined, value: validatedData });
      mockReq.body = undefined;

      validate(mockSchema)(mockReq, mockRes, mockNext);

      expect(mockSchema.validate).toHaveBeenCalledWith(undefined, {
        abortEarly: false,
        stripUnknown: true
      });
      expect(mockReq.body).toEqual({});
      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should strip unknown properties from request body', () => {
      const validatedData = { name: 'John Doe' };
      mockSchema.validate.mockReturnValue({ error: undefined, value: validatedData });
      mockReq.body = { name: 'John Doe', unknownField: 'value' };

      validate(mockSchema)(mockReq, mockRes, mockNext);

      expect(mockSchema.validate).toHaveBeenCalledWith({ name: 'John Doe', unknownField: 'value' }, {
        abortEarly: false,
        stripUnknown: true
      });
      expect(mockReq.body).toEqual(validatedData);
      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
