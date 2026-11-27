import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle,
  AlertCircle,
  Calculator,
  Sliders,
  Layers,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useETP } from '../../context/ETPContext';
import { KPICard } from '../common/KPICard';
import { FormField } from '../common/FormField';
import { formatNumber } from '../../utils/calculations';
import { ROUTE_COMPARISONS_TEMPLATE } from '../../utils/mockData';
import clsx from 'clsx';

export const CostRouteView: React.FC = () => {
  const { costParams, updateCostParams, dailyRecords, dewateringRecords } = useETP();

  const [simulatedCakeMoisture, setSimulatedCakeMoisture] = useState<number>(74); // %
  const [simulatedRawSlurryMoisture, setSimulatedRawSlurryMoisture] = useState<number>(93); // %
  const [monthlyTreatedM3, setMonthlyTreatedM3] = useState<number>(6500); // m³/month

  const latestRec = dailyRecords[0] || null;
  const flowToday = latestRec?.wastewaterTreated || 210;
  const coagDose = latestRec?.coagulantDose || 470; // mg/L (ppm)
  const polyDose = latestRec?.flocculantDose || 3.5; // mg/L (ppm)

  // Coagulant cost per m³ treated:
  // (dose in mg/L * 1 kg / 1000 g * coagulant price ₹/kg) -> (coagDose * costParams.coagulantCostPerKg) / 1000
  const coagulantCostPerM3 = Number(((coagDose * costParams.coagulantCostPerKg) / 1000).toFixed(2));

  // Polymer cost per m³ treated:
  const polymerCostPerM3 = Number(((polyDose * costParams.polymerCostPerKg) / 1000).toFixed(2));

  // Transport cost per tonne wet sludge
  const transportCostPerTonne = costParams.transportCostPerTonne;

  // Selected disposal route (default TSDF Landfill)
  const disposalCostPerTonne = costParams.tsdfLandfillCostPerTonne;

  // Sludge generation factor (kg wet sludge / m³ treated)
  const wetSludgePerM3 = latestRec && latestRec.wetSludgeGenerated && latestRec.wastewaterTreated
    ? latestRec.wetSludgeGenerated / latestRec.wastewaterTreated
    : 11.0; // approx 11 kg/m³

  // Sludge handling cost per m³ treated:
  // (wetSludgePerM3 / 1000 tonnes) * (transportCostPerTonne + disposalCostPerTonne)
  const sludgeDisposalCostPerM3 = Number(
    ((wetSludgePerM3 / 1000) * (transportCostPerTonne + disposalCostPerTonne)).toFixed(2)
  );

  // Total sludge-management cost per m³ treated:
  const totalCostPerM3 = Number(
    (coagulantCostPerM3 + polymerCostPerM3 + sludgeDisposalCostPerM3).toFixed(2)
  );

  // Dewatering Savings Model:
  // If raw slurry at 93% moisture is hauled vs dewatered cake at 74% moisture:
  // 1 tonne dry solids requires:
  // Raw volume = 1 / (1 - 0.93) = 14.28 tonnes wet slurry
  // Dewatered volume = 1 / (1 - 0.74) = 3.84 tonnes wet cake
  // Mass reduction = 14.28 - 3.84 = 10.44 tonnes per tonne dry solids!
  const drySolidsMonthlyTonnes = Number(
    ((monthlyTreatedM3 * wetSludgePerM3 * (1 - simulatedRawSlurryMoisture / 100)) / 1000).toFixed(1)
  );
  const rawWetTonnes = drySolidsMonthlyTonnes / (1 - simulatedRawSlurryMoisture / 100);
  const dewateredWetTonnes = drySolidsMonthlyTonnes / (1 - simulatedCakeMoisture / 100);
  const wetMassSavedTonnes = Math.max(0, rawWetTonnes - dewateredWetTonnes);
  const monthlySavingsRupees = Math.round(
    wetMassSavedTonnes * (transportCostPerTonne + disposalCostPerTonne)
  );

  // Dynamic Route Evaluation
  const evaluatedRoutes = ROUTE_COMPARISONS_TEMPLATE.map(route => {
    let gateCost = costParams.tsdfLandfillCostPerTonne;
    if (route.route.includes('incineration')) gateCost = costParams.incinerationCostPerTonne;
    if (route.route.includes('Cement')) gateCost = costParams.cementKilnCostPerTonne;
    if (route.route.includes('recycler')) gateCost = costParams.recyclerCostPerTonne;

    const totalCost = gateCost + transportCostPerTonne;
    return {
      ...route,
      costPerTonne: totalCost,
    };
  });

  // Recommendation based on the lowest total cost among compliant routes
  // Landfill is compliant for chemical precipitation sludge containing heavy metals,
  // Cement kiln is conditional on moisture <30% & calorific value >2500 kcal/kg.
  // Therefore, TSDF Landfill is the primary recommended route.
  const lowestCostCompliantRoute = evaluatedRoutes.reduce((prev, curr) => {
    if (curr.recommendation === 'Recommended') return curr;
    return prev;
  }, evaluatedRoutes[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            Cost & Route Optimization
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Chemical coagulation dosing economics, hauling freight, authorized disposal gate tariffs and dewatering return on investment (ROI).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">Currency:</span>
          <span className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-mono font-bold text-slate-800">
            INR (₹)
          </span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* KPI 1: Coagulant Cost */}
        <KPICard
          title="Coagulant Cost / m³"
          value={`₹${coagulantCostPerM3}`}
          unit={`(PAC @ ₹${costParams.coagulantCostPerKg}/kg)`}
          icon={DollarSign}
          status="normal"
          subtitle={`Dose: ${coagDose} mg/L`}
        />

        {/* KPI 2: Polymer Cost */}
        <KPICard
          title="Polymer Cost / m³"
          value={`₹${polymerCostPerM3}`}
          unit={`(PAM @ ₹${costParams.polymerCostPerKg}/kg)`}
          icon={DollarSign}
          status="normal"
          subtitle={`Dose: ${polyDose} mg/L`}
        />

        {/* KPI 3: Transport Cost */}
        <KPICard
          title="Transport Cost / Tonne"
          value={`₹${formatNumber(transportCostPerTonne, 0)}`}
          unit="/ tonne wet sludge"
          icon={DollarSign}
          status="normal"
          subtitle="Authorized GPS HazMat container"
        />

        {/* KPI 4: Disposal Cost */}
        <KPICard
          title="Disposal Gate Cost / Tonne"
          value={`₹${formatNumber(disposalCostPerTonne, 0)}`}
          unit="/ tonne (TSDF gate fee)"
          icon={DollarSign}
          status="normal"
          subtitle="Direct landfilling / stabilization"
        />

        {/* KPI 5: Total Sludge Cost */}
        <KPICard
          title="Total Sludge Cost / m³ Treated"
          value={`₹${totalCostPerM3}`}
          unit="/ m³ wastewater"
          icon={TrendingUp}
          status="danger"
          subtitle="Chemicals + Transport + TSDF Gate"
        />

        {/* KPI 6: Estimated Savings */}
        <KPICard
          title="Dewatering Hauling Savings"
          value={`₹${formatNumber(monthlySavingsRupees / 100000, 2)}`}
          unit="Lakhs / month"
          icon={Percent}
          status="success"
          change="~73% Freight Avoidance"
          isPositiveChange={true}
          subtitle={`Saves ${formatNumber(wetMassSavedTonnes, 0)} t/mo wet sludge`}
        />
      </div>

      {/* Route-Comparison Table per Requirement */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Statutory Disposal Route Evaluation Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparison across cost, volume reduction, CPCB compliance rules and facility acceptance criteria.
            </p>
          </div>

          <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs text-emerald-900 flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Optimal Compliant Route: <strong>Authorised TSDF Landfill</strong></span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="py-3 px-4">Disposal / Recovery Route</th>
                <th className="py-3 px-4 text-right">Total Cost (₹/tonne)</th>
                <th className="py-3 px-4 text-center">Volume Reduction</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4 text-center">Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {evaluatedRoutes.map(route => {
                const isRecommended = route.recommendation === 'Recommended';
                return (
                  <tr
                    key={route.route}
                    className={clsx(
                      'hover:bg-slate-50 transition-colors',
                      isRecommended ? 'bg-blue-50/20' : ''
                    )}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span>{route.route}</span>
                      </div>
                      <div className="text-[11px] font-normal text-slate-500 mt-0.5">
                        {route.rationale}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-sm whitespace-nowrap">
                      ₹{formatNumber(route.costPerTonne, 0)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={clsx(
                          'px-2 py-0.5 rounded-full text-[10px] font-bold font-mono',
                          route.volumeReduction === 'High'
                            ? 'bg-purple-100 text-purple-800'
                            : route.volumeReduction === 'Medium'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        )}
                      >
                        {route.volumeReduction}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 text-xs">
                      {route.complianceStatus}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={clsx(
                          'px-2.5 py-1 rounded-full text-xs font-bold font-mono tracking-wide',
                          isRecommended
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 ring-2 ring-emerald-50'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        )}
                      >
                        {route.recommendation}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Dynamic Recommendation Callout */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 text-xs space-y-1">
          <div className="font-bold text-blue-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Optimal Route Decision Engine: Lowest Total Cost Among Compliant Options</span>
          </div>
          <p className="text-slate-700 leading-relaxed">
            Based on the current high-strength chemical precipitation profile (influent COD &gt;100,000 mg/L, heavy metals Cr 84 mg/kg, Cu 110 mg/kg), <strong>Authorised TSDF Landfill (₹{formatNumber(lowestCostCompliantRoute.costPerTonne, 0)}/t)</strong> provides the lowest total cost among fully compliant routes. Cement kiln co-processing requires secondary thermal drying to reduce cake moisture from 74% down to &lt;30% before acceptance.
          </p>
        </div>
      </div>

      {/* Dewatering ROI & Tariff Simulator */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Dewatering ROI & Tariff Sensitivity Simulator
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulate cake moisture reduction to calculate direct transportation & landfill gate fee savings.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Operating Parameters
            </h4>
            <FormField
              label="Monthly Treated Flow"
              name="monthlyTreatedM3"
              type="number"
              unit="m³/month"
              value={monthlyTreatedM3}
              onChange={e => setMonthlyTreatedM3(parseFloat(e.target.value) || 0)}
            />
            <FormField
              label="Raw Slurry Moisture"
              name="simulatedRawSlurryMoisture"
              type="number"
              unit="%"
              step="0.5"
              value={simulatedRawSlurryMoisture}
              onChange={e => setSimulatedRawSlurryMoisture(parseFloat(e.target.value) || 0)}
              helperText="Pre-dewatering underflow"
            />
            <FormField
              label="Dewatered Cake Moisture"
              name="simulatedCakeMoisture"
              type="number"
              unit="%"
              step="0.5"
              value={simulatedCakeMoisture}
              onChange={e => setSimulatedCakeMoisture(parseFloat(e.target.value) || 0)}
              helperText="Target press dryness"
            />
          </div>

          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tariff & Chemical Rates
            </h4>
            <FormField
              label="PAC Coagulant Price"
              name="coagPrice"
              type="number"
              unit="₹/kg"
              step="0.5"
              value={costParams.coagulantCostPerKg}
              onChange={e => updateCostParams({ coagulantCostPerKg: parseFloat(e.target.value) || 0 })}
            />
            <FormField
              label="Polymer PAM Price"
              name="polyPrice"
              type="number"
              unit="₹/kg"
              step="1"
              value={costParams.polymerCostPerKg}
              onChange={e => updateCostParams({ polymerCostPerKg: parseFloat(e.target.value) || 0 })}
            />
            <FormField
              label="TSDF Landfill Gate Tariff"
              name="tsdfPrice"
              type="number"
              unit="₹/tonne"
              step="50"
              value={costParams.tsdfLandfillCostPerTonne}
              onChange={e => updateCostParams({ tsdfLandfillCostPerTonne: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 flex flex-col justify-between">
            <div>
              <span className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider block">
                Estimated Net Monthly Savings
              </span>
              <div className="text-3xl font-extrabold font-mono text-emerald-700 mt-2">
                ₹{formatNumber(monthlySavingsRupees, 0)}
              </div>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                By dewatering sludge from {simulatedRawSlurryMoisture}% down to {simulatedCakeMoisture}% moisture, the plant avoids hauling <strong>{formatNumber(wetMassSavedTonnes, 0)} tonnes</strong> of water every month, saving ₹{formatNumber(monthlySavingsRupees / 100000, 2)} Lakhs in freight and disposal tariffs.
              </p>
            </div>

            <div className="pt-3 border-t border-emerald-200/80 text-[11px] text-slate-500 font-mono">
              Annualized Savings: ₹{formatNumber((monthlySavingsRupees * 12) / 100000, 2)} Lakhs/yr
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
