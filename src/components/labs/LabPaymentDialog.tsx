import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLabOrderStore } from '@/store/labOrderStore'
import { useLabStore } from '@/store/labStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import { notify } from '@/services/notificationService'
import {
  CreditCard,
  DollarSign,
  Calculator,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Building2,
  Calendar
} from 'lucide-react'
import type { LabOrder } from '@/types'

interface LabPaymentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function LabPaymentDialog({ open, onOpenChange }: LabPaymentDialogProps) {
  const { labOrders, applyGeneralPayment, isLoading } = useLabOrderStore()
  const { labs, loadLabs } = useLabStore()
  const [selectedLabId, setSelectedLabId] = useState<string>('')
  const [paymentAmount, setPaymentAmount] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load labs when dialog opens
  useEffect(() => {
    if (open) {
      loadLabs()
    }
  }, [open, loadLabs])

  // Get orders for selected lab
  const selectedLabOrders = selectedLabId 
    ? labOrders.filter(order => order.lab_id === selectedLabId)
    : []

  // Get selected lab info
  const selectedLab = labs.find(lab => lab.id === selectedLabId)

  // Calculate totals for selected lab
  const labTotalCost = selectedLabOrders.reduce((sum, order) => sum + order.cost, 0)
  const labTotalPaid = selectedLabOrders.reduce((sum, order) => sum + (order.paid_amount || 0), 0)
  const labTotalRemaining = selectedLabOrders.reduce((sum, order) => {
    const remaining = order.remaining_balance || (order.cost - (order.paid_amount || 0))
    return sum + Math.max(0, remaining)
  }, 0)

  // Get orders with remaining balance for selected lab, sorted by remaining balance (smallest first)
  const ordersWithRemaining = selectedLabOrders
    .map(order => {
      const remaining = order.remaining_balance || (order.cost - (order.paid_amount || 0))
      return { ...order, calculatedRemaining: Math.max(0, remaining) }
    })
    .filter(order => order.calculatedRemaining > 0)
    .sort((a, b) => a.calculatedRemaining - b.calculatedRemaining)

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedLabId('')
      setPaymentAmount('')
      setErrors({})
    }
  }, [open])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!selectedLabId) {
      newErrors.labId = 'يجب اختيار المخبر أولاً'
    }

    if (!paymentAmount.trim()) {
      newErrors.paymentAmount = 'المبلغ المدفوع مطلوب'
    } else {
      const amount = parseFloat(paymentAmount)
      if (isNaN(amount) || amount <= 0) {
        newErrors.paymentAmount = 'المبلغ يجب أن يكون رقم موجب'
      } else if (amount > labTotalRemaining) {
        newErrors.paymentAmount = `المبلغ لا يمكن أن يتجاوز إجمالي المتبقي على المخبر (${formatCurrency(labTotalRemaining)})`
      }
    }

    if (selectedLabId && ordersWithRemaining.length === 0) {
      newErrors.paymentAmount = 'لا توجد طلبات لهذا المخبر لها رصيد متبقي'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    try {
      const amount = parseFloat(paymentAmount)
      if (!selectedLabId) {
        notify.error('يجب اختيار المخبر أولاً')
        return
      }
      
      await applyGeneralPayment(selectedLabId, amount)
      
      notify.success(`تم توزيع دفعة بقيمة ${formatCurrency(amount)} على طلبات المخبر "${selectedLab?.name}" بنجاح`)
      setSelectedLabId('')
      setPaymentAmount('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error applying general payment:', error)
      notify.error('فشل في تطبيق الدفعة العامة')
    }
  }

  // Calculate distribution preview
  const calculateDistributionPreview = (amount: number): Array<{ order: LabOrder & { calculatedRemaining: number }, applied: number }> => {
    const preview: Array<{ order: LabOrder & { calculatedRemaining: number }, applied: number }> = []
    let remainingAmount = amount

    for (const order of ordersWithRemaining) {
      if (remainingAmount <= 0) break

      const applied = Math.min(order.calculatedRemaining, remainingAmount)
      preview.push({ order, applied })
      remainingAmount -= applied
    }

    return preview
  }

  const previewAmount = parseFloat(paymentAmount) || 0
  const distributionPreview = previewAmount > 0 && previewAmount <= labTotalRemaining && selectedLabId
    ? calculateDistributionPreview(previewAmount)
    : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader className="text-right" dir="rtl">
          <DialogTitle className="flex items-center gap-2 justify-end text-right">
            <span>دفعة عامة لمخبر محدد</span>
            <CreditCard className="h-5 w-5 text-blue-600" />
          </DialogTitle>
          <DialogDescription className="text-right">
            إضافة دفعة عامة واحدة يتم توزيعها تلقائياً على طلبات المخبر المختار
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
          {/* Lab Selection */}
          <div className="space-y-2">
            <Label htmlFor="lab_id" className="flex items-center gap-2 justify-start text-right font-medium" dir="rtl">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span>اختر المخبر *</span>
            </Label>
            <Select
              value={selectedLabId}
              onValueChange={(value) => {
                setSelectedLabId(value)
                setPaymentAmount('')
                setErrors(prev => ({ ...prev, labId: '', paymentAmount: '' }))
              }}
              disabled={isLoading}
              dir="rtl"
            >
              <SelectTrigger className={`text-right ${errors.labId ? 'border-destructive' : ''}`}>
                <SelectValue placeholder="اختر المخبر" className="text-muted-foreground" />
              </SelectTrigger>
              <SelectContent>
                {labs.map((lab) => {
                  const labRemaining = labOrders
                    .filter(order => order.lab_id === lab.id)
                    .reduce((sum, order) => {
                      const remaining = order.remaining_balance || (order.cost - (order.paid_amount || 0))
                      return sum + Math.max(0, remaining)
                    }, 0)
                  return (
                    <SelectItem key={lab.id} value={lab.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{lab.name}</span>
                        {labRemaining > 0 && (
                          <span className="text-xs text-orange-600 mr-2">
                            (متبقي: {formatCurrency(labRemaining)})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {errors.labId && (
              <p className="text-sm text-destructive text-right">{errors.labId}</p>
            )}
          </div>

          {/* Lab Summary */}
          {selectedLabId && selectedLab && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">
                  إجمالي المبلغ المطلوب للمخبر "{selectedLab.name}"
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-foreground">
                    {formatCurrency(labTotalCost)}
                  </span>
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-muted-foreground">
                  إجمالي المبلغ المدفوع
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-green-600">
                    {formatCurrency(labTotalPaid)}
                  </span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <Label className="text-sm font-medium text-muted-foreground">
                  الرصيد المتبقي
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(labTotalRemaining)}
                  </span>
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                عدد الطلبات: {selectedLabOrders.length} | طلبات برصيد متبقي: {ordersWithRemaining.length}
              </div>
            </div>
          )}

          {/* Orders List for Selected Lab */}
          {selectedLabId && selectedLabOrders.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 justify-start text-right font-medium" dir="rtl">
                <Building2 className="h-4 w-4 text-purple-600" />
                <span>طلبات المخبر ({selectedLabOrders.length})</span>
              </Label>
              <div className="bg-muted/30 rounded-lg border p-3 space-y-2 max-h-[200px] overflow-y-auto">
                {selectedLabOrders.map((order) => {
                  const remaining = order.remaining_balance || (order.cost - (order.paid_amount || 0))
                  const calculatedRemaining = Math.max(0, remaining)
                  return (
                    <div key={order.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                      <div className="flex-1 text-right">
                        <div className="font-medium">{order.service_name || 'بدون اسم خدمة'}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                          <span>التكلفة: {formatCurrency(order.cost)}</span>
                          <span>|</span>
                          <span>المدفوع: {formatCurrency(order.paid_amount || 0)}</span>
                          <span>|</span>
                          <span className={calculatedRemaining > 0 ? 'text-orange-600' : 'text-green-600'}>
                            متبقي: {formatCurrency(calculatedRemaining)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 inline ml-1" />
                          {formatDate(order.order_date)}
                        </div>
                      </div>
                      {calculatedRemaining <= 0 && (
                        <CheckCircle className="h-4 w-4 text-green-600 ml-2" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Payment Amount Input */}
          {selectedLabId && (
            <div className="space-y-2">
              <Label htmlFor="paymentAmount" className="flex items-center gap-2 justify-start text-right font-medium" dir="rtl">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span>مبلغ الدفعة العامة للمخبر *</span>
              </Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0"
                max={labTotalRemaining}
                value={paymentAmount}
                onChange={(e) => {
                  setPaymentAmount(e.target.value)
                  if (errors.paymentAmount) {
                    setErrors(prev => ({ ...prev, paymentAmount: '' }))
                  }
                }}
                onBlur={(e) => {
                  const value = parseFloat(e.target.value) || 0
                  if (value > labTotalRemaining) {
                    setPaymentAmount(labTotalRemaining.toString())
                  }
                }}
                placeholder="0.00"
                className={`text-right ${errors.paymentAmount ? 'border-destructive' : ''}`}
                disabled={isLoading || ordersWithRemaining.length === 0 || !selectedLabId}
                dir="rtl"
              />
              {errors.paymentAmount && (
                <p className="text-sm text-destructive text-right">{errors.paymentAmount}</p>
              )}
              <div className="text-xs text-muted-foreground text-right">
                الحد الأقصى المسموح: {formatCurrency(labTotalRemaining)}
              </div>
            </div>
          )}

          {/* Distribution Preview */}
          {distributionPreview.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2 justify-start text-right font-medium" dir="rtl">
                <Calculator className="h-4 w-4 text-green-600" />
                <span>معاينة التوزيع:</span>
              </Label>
              <div className="bg-muted/30 rounded-lg border p-4 space-y-2 max-h-[200px] overflow-y-auto">
                {distributionPreview.map((item, index) => (
                  <div key={item.order.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div className="flex-1 text-right">
                      <div className="font-medium">{item.order.service_name || 'بدون اسم خدمة'}</div>
                      <div className="text-xs text-muted-foreground">
                        متبقي: {formatCurrency(item.order.calculatedRemaining)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mr-4">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(item.applied)}
                      </span>
                      {item.applied >= item.order.calculatedRemaining && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                  </div>
                ))}
                {previewAmount > labTotalRemaining && (
                  <div className="text-xs text-orange-600 mt-2 text-right">
                    المبلغ المتبقي بعد التوزيع: {formatCurrency(previewAmount - labTotalRemaining)}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Info Alert */}
          {selectedLabId && ordersWithRemaining.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-800 dark:text-blue-200 text-right">
                <div className="font-medium mb-1">ملاحظة مهمة:</div>
                <div>سيتم توزيع الدفعة تلقائياً على طلبات المخبر "{selectedLab?.name}" حسب الترتيب التالي:</div>
                <div className="mt-1">• بدءاً من الطلب ذو المبلغ المتبقي الأصغر أولاً</div>
                <div>• ثم الطلب التالي تصاعدياً حتى استهلاك كامل مبلغ الدفعة</div>
              </div>
            </div>
          )}

          {selectedLabId && ordersWithRemaining.length === 0 && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="text-sm text-green-800 dark:text-green-200 text-right">
                جميع طلبات المخبر "{selectedLab?.name}" مدفوعة بالكامل. لا يوجد رصيد متبقي.
              </div>
            </div>
          )}

          {!selectedLabId && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
              <div className="text-sm text-yellow-800 dark:text-yellow-200 text-right">
                يرجى اختيار المخبر أولاً لعرض التفاصيل وإدخال الدفعة
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-row-reverse gap-2 pt-4" dir="rtl">
            <Button
              type="submit"
              disabled={isLoading || ordersWithRemaining.length === 0 || !selectedLabId}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التطبيق...
                </>
              ) : (
                'تطبيق الدفعة'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
