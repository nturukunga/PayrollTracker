import { useRef } from 'react';
import { PayslipData } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

interface PayslipProps {
  data: PayslipData;
  onPrint?: () => void;
  onDownload?: () => void;
}

export function Payslip({ data, onPrint, onDownload }: PayslipProps) {
  const payslipRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      const content = payslipRef.current;
      if (content) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(`
            <html>
              <head>
                <title>Payslip - ${data.employee.firstName} ${data.employee.lastName}</title>
                <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
                <style>
                  body {
                    font-family: 'Roboto', sans-serif;
                    padding: 20px;
                  }
                  .payslip {
                    max-width: 800px;
                    margin: 0 auto;
                    border: 1px solid #e0e0e0;
                    padding: 20px;
                  }
                  .payslip-header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 20px;
                    border-bottom: 1px solid #e0e0e0;
                  }
                  .company-name {
                    font-weight: bold;
                    font-size: 24px;
                    margin-bottom: 5px;
                  }
                  .payslip-title {
                    font-size: 18px;
                    color: #666;
                    margin-bottom: 10px;
                  }
                  .payslip-period {
                    font-size: 14px;
                    color: #666;
                  }
                  .payslip-info {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 20px;
                  }
                  .employee-info, .payment-info {
                    width: 48%;
                  }
                  h3 {
                    font-size: 16px;
                    border-bottom: 1px solid #e0e0e0;
                    padding-bottom: 5px;
                    margin-bottom: 10px;
                  }
                  .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                    font-size: 14px;
                  }
                  .info-label {
                    font-weight: bold;
                    color: #666;
                  }
                  .payslip-details {
                    margin-bottom: 20px;
                  }
                  .details-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #f5f5f5;
                  }
                  .details-row:last-child {
                    border-bottom: none;
                  }
                  .payslip-summary {
                    background-color: #f9f9f9;
                    padding: 15px;
                    border-radius: 4px;
                  }
                  .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 5px;
                  }
                  .net-pay {
                    font-weight: bold;
                    font-size: 18px;
                    color: #1976d2;
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #e0e0e0;
                  }
                  .footer {
                    margin-top: 30px;
                    text-align: center;
                    font-size: 12px;
                    color: #999;
                  }
                  @media print {
                    body {
                      -webkit-print-color-adjust: exact;
                      print-color-adjust: exact;
                    }
                  }
                </style>
              </head>
              <body>
                ${content.outerHTML}
              </body>
            </html>
          `);
          printWindow.document.close();
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }
      }
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-end space-x-2 mb-4">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="outline" size="sm" onClick={onDownload}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
      
      <div ref={payslipRef} className="payslip">
        <div className="payslip-header">
          <div className="company-name">{data.companyDetails.name}</div>
          <div className="payslip-title">PAYSLIP</div>
          <div className="payslip-period">
            Pay Period: {formatDate(data.period.startDate)} - {formatDate(data.period.endDate)}
          </div>
        </div>
        
        <div className="payslip-info">
          <div className="employee-info">
            <h3>Employee Information</h3>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span>{data.employee.firstName} {data.employee.lastName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Employee ID:</span>
              <span>{data.employee.employeeCode}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Department:</span>
              <span>{data.employee.department}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Position:</span>
              <span>{data.employee.position}</span>
            </div>
          </div>
          
          <div className="payment-info">
            <h3>Payment Information</h3>
            <div className="info-row">
              <span className="info-label">Payment Date:</span>
              <span>{data.period.processedDate ? formatDate(data.period.processedDate) : 'Pending'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Payment Method:</span>
              <span>Bank Transfer</span>
            </div>
            <div className="info-row">
              <span className="info-label">Bank:</span>
              <span>{data.employee.bankName || 'Not specified'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Account:</span>
              <span>{data.employee.bankAccountNumber || 'Not specified'}</span>
            </div>
          </div>
        </div>
        
        <div className="payslip-details">
          <h3>Earnings</h3>
          <div className="details-row">
            <span>Basic Salary</span>
            <span>{formatCurrency(Number(data.payrollItem.basicSalary))}</span>
          </div>
          
          {data.payrollItem.overtimeAmount > 0 && (
            <div className="details-row">
              <span>Overtime ({data.payrollItem.overtimeHours} hours)</span>
              <span>{formatCurrency(Number(data.payrollItem.overtimeAmount))}</span>
            </div>
          )}
          
          {data.allowances.map((allowance, index) => (
            <div className="details-row" key={index}>
              <span>{allowance.type}</span>
              <span>{formatCurrency(allowance.amount)}</span>
            </div>
          ))}
          
          <div className="details-row">
            <strong>Gross Pay</strong>
            <strong>{formatCurrency(Number(data.payrollItem.grossPay))}</strong>
          </div>
        </div>
        
        <div className="payslip-details">
          <h3>Deductions</h3>
          <div className="details-row">
            <span>Tax</span>
            <span>{formatCurrency(Number(data.payrollItem.taxAmount))}</span>
          </div>
          
          {data.deductions.map((deduction, index) => (
            <div className="details-row" key={index}>
              <span>{deduction.type}</span>
              <span>{formatCurrency(deduction.amount)}</span>
            </div>
          ))}
          
          {data.payrollItem.otherDeductions > 0 && (
            <div className="details-row">
              <span>Other Deductions</span>
              <span>{formatCurrency(Number(data.payrollItem.otherDeductions))}</span>
            </div>
          )}
          
          <div className="details-row">
            <strong>Total Deductions</strong>
            <strong>{formatCurrency(Number(data.payrollItem.taxAmount) + Number(data.payrollItem.otherDeductions))}</strong>
          </div>
        </div>
        
        <div className="payslip-summary">
          <div className="summary-row">
            <strong>Gross Pay:</strong>
            <span>{formatCurrency(Number(data.payrollItem.grossPay))}</span>
          </div>
          <div className="summary-row">
            <strong>Total Deductions:</strong>
            <span>{formatCurrency(Number(data.payrollItem.taxAmount) + Number(data.payrollItem.otherDeductions))}</span>
          </div>
          <div className="net-pay">
            <strong>Net Pay:</strong>
            <strong>{formatCurrency(Number(data.payrollItem.netPay))}</strong>
          </div>
        </div>
        
        <div className="footer">
          <p>This is a computer-generated document. No signature is required.</p>
          <p>{data.companyDetails.name} | {data.companyDetails.address} | {data.companyDetails.phone} | {data.companyDetails.email}</p>
        </div>
      </div>
    </Card>
  );
}
